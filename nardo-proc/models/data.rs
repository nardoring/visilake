use arrow::{
    array::{BooleanArray, TimestampNanosecondArray},
    compute::filter_record_batch,
    csv,
    record_batch::RecordBatch,
};
use arrow_csv::reader::Format;
use eyre::Result;
use log::debug;
use parquet::{
    arrow::{arrow_reader::ParquetRecordBatchReaderBuilder, ArrowWriter},
    basic::Compression,
    file::properties::WriterProperties,
};
use std::{fs::File, io::Seek, sync::Arc};

#[derive(Debug, Clone)]
pub struct TimeSeriesData {
    record_batches: Vec<RecordBatch>,
}

impl TimeSeriesData {
    /// Returns a TimeSeriesData from dataset in .parquet on disk at `infile`
    pub fn from_parquet(infile: &str) -> arrow::error::Result<Self> {
        let file = File::open(infile).unwrap();
        let builder = ParquetRecordBatchReaderBuilder::try_new(file).unwrap();
        debug!("Converted arrow schema is: {}", builder.schema());

        let mut reader = builder.build().unwrap();

        let mut record_batches = Vec::new();
        while let Some(Ok(batch)) = reader.next() {
            record_batches.push(batch);
        }

        Ok(TimeSeriesData { record_batches })
    }

    /// Returns a TimeSeriesData from a given filepath to a .parquet dataset
    pub fn from_csv(infile: &str) -> Result<Self> {
        let mut file = File::open(&infile).unwrap();
        let format = Format::default().with_header(true);
        let (schema, _) = format.infer_schema(&mut file, Some(100)).unwrap();
        file.seek(std::io::SeekFrom::Start(0)).unwrap();

        let builder = csv::ReaderBuilder::new(Arc::new(schema))
            .with_format(format)
            .with_batch_size(512);
        let mut csv_reader = builder.build(file).unwrap();

        let mut record_batches = Vec::new();

        while let Some(Ok(batch)) = csv_reader.next() {
            record_batches.push(batch);
        }

        debug!(
            "Read {} batches to parquet from {}",
            record_batches.len(),
            infile
        );

        Ok(TimeSeriesData { record_batches })
    }

    /// Writes the TimeSeriesData to disk in parquet format
    pub fn to_parquet(&self, outfile: &str) -> Result<()> {
        let file = File::create(outfile).unwrap();
        let writer_props = WriterProperties::builder()
            .set_compression(Compression::SNAPPY)
            .build();
        let mut writer = ArrowWriter::try_new(
            file,
            Arc::new(self.record_batches[0].schema().as_ref().clone()),
            Some(writer_props),
        )
        .unwrap();

        for batch in &self.record_batches {
            writer.write(&batch)?;
        }

        debug!(
            "Wrote {} batches of parquet to {}",
            self.record_batches.len(),
            outfile
        );

        writer.close()?;
        Ok(())
    }

    /// Returns a new instance of TimeSeriesData representing the filtered dataset
    pub fn filter_by_time_range(&self, start_time: i64, end_time: i64) -> Self {
        let filtered_batches: Vec<RecordBatch> = self
            .record_batches
            .iter()
            .map(|batch| {
                let timestamp_col_index = batch
                    .schema()
                    .fields()
                    .iter()
                    .position(|field| field.name() == "timestamp")
                    .expect("Timestamp column not found");

                let timestamp_col = batch
                    .column(timestamp_col_index)
                    .as_any()
                    .downcast_ref::<TimestampNanosecondArray>()
                    .expect("Timestamp column has incorrect type");

                let mask = timestamp_col
                    .iter()
                    .map(|maybe_time| maybe_time.map(|time| time >= start_time && time <= end_time))
                    .collect::<BooleanArray>();

                filter_record_batch(batch, &mask)
                    .expect("Failed to filter record batch by time range")
            })
            .collect();

        TimeSeriesData {
            record_batches: filtered_batches,
        }
    }

    /// Returns a new instance of TimeSeriesData representing the filtered dataset
    pub fn filter_by_granularity(&self, granularity: i64) -> Self {
        let filtered_batches: Vec<RecordBatch> = self
            .record_batches
            .iter()
            .map(|batch| {
                let timestamp_col_index = batch
                    .schema()
                    .fields()
                    .iter()
                    .position(|field| field.name() == "timestamp")
                    .expect("Timestamp column not found");

                let timestamp_col = batch
                    .column(timestamp_col_index)
                    .as_any()
                    .downcast_ref::<TimestampNanosecondArray>()
                    .expect("Timestamp column has incorrect type");

                // granularity is given in milliseconds, convert it to nanoseconds
                let granularity_ns = granularity * 1_000_000;

                let mask = timestamp_col
                    .iter()
                    .map(|maybe_time| maybe_time.map(|time| time % granularity_ns == 0))
                    .collect::<BooleanArray>();

                filter_record_batch(batch, &mask)
                    .expect("Failed to filter record batch by granularity")
            })
            .collect();

        TimeSeriesData {
            record_batches: filtered_batches,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use arrow::{
        array::{ArrayRef, Date32Array, Float64Array, Int64Array},
        datatypes::{DataType, Field, Schema, TimeUnit},
        util::pretty::print_batches,
    };
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn from_csv_handles_variety_of_types() {
        let csv_data = r#"
            c_int,c_float,c_string,c_bool,c_date,c_datetime
            1,1.1,\"1.11\",true,1970-01-01,1970-01-01T00:00:00
            2,2.2,\"2.22\",true,2020-11-08,2020-11-08T01:00:00
            3,,\"3.33\",true,1969-12-31,1969-11-08T02:00:00
            4,4.4,,false,,
            5,6.6,\"\",false,1990-01-01,1990-01-01T03:00:00
            4,4e6,,false,,
            4,4.0e-6,,false,,
"#;
        let mut tmpfile = NamedTempFile::new().unwrap();
        writeln!(tmpfile, "{}", csv_data).unwrap();

        let infile = tmpfile.path().to_str().unwrap().to_string();

        let ts_data_result = TimeSeriesData::from_csv(&infile);
        assert!(ts_data_result.is_ok());

        let ts_data = ts_data_result.unwrap();
        assert_eq!(ts_data.record_batches.len(), 1);

        let batch = &ts_data.record_batches[0];

        print_batches(&[batch.clone()]).unwrap();
        assert_eq!(batch.num_rows(), 7);

        let c_float = batch
            .column(1)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        assert!((c_float.value(0) - 1.1).abs() < f64::EPSILON);

        let c_bool = batch
            .column(3)
            .as_any()
            .downcast_ref::<BooleanArray>()
            .unwrap();
        assert_eq!(c_bool.value(0), true);

        // Days since Unix epoch (for Date32Array):

        //     1970-01-01: 0 days
        //     2020-11-08: 18574 days
        //     1969-12-31: -1 days
        //     1990-01-01: 7305 days

        if let Some(c_date) = batch.column(4).as_any().downcast_ref::<Date32Array>() {
            assert_eq!(c_date.value(0), 0); // 1970-01-01
            assert_eq!(c_date.value(1), 18574); // 2020-11-08
            assert_eq!(c_date.value(2), -1); // 1969-12-31
            assert_eq!(c_date.value(4), 7305); // 1990-01-01
        }

        // Nanoseconds since Unix epoch (for TimestampNanosecondArray):

        //     1970-01-01T00:00:00: 0 nanoseconds
        //     2020-11-08T01:00:00: 1.6047972e+18 nanoseconds
        //     1969-11-08T02:00:00: -4658400000000000 nanoseconds
        //     1990-01-01T03:00:00: 6.311628e+17 nanoseconds
        // Date32Array for days since Unix epoch

        if let Some(c_datetime) = batch
            .column(5)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
        {
            assert_eq!(c_datetime.value(0) as f64, 0.0); // 1970-01-01T00:00:00
            assert_eq!(c_datetime.value(1) as f64, 1.6047972e+18); // 2020-11-08T01:00:00
            assert_eq!(c_datetime.value(2) as f64, -4658400000000000.0); // 1969-11-08T02:00:00
            assert_eq!(c_datetime.value(4) as f64, 6.311628e+17); // 1990-01-01T03:00:00
        }
    }

    /// Helper function to create a TimeSeriesData instance from given timestamps and values
    fn create_timeseries_data(timestamps: Vec<Option<i64>>, values: Vec<i64>) -> TimeSeriesData {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamp_array = TimestampNanosecondArray::from(timestamps);
        let value_array = Int64Array::from(values);

        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamp_array) as ArrayRef,
                Arc::new(value_array) as ArrayRef,
            ],
        )
        .expect("Failed to create record batch");

        TimeSeriesData {
            record_batches: vec![batch],
        }
    }

    #[test]
    fn filter_by_granularity_filters() {
        let ts_data = create_timeseries_data(
            vec![
                Some(0),             // 0ms
                Some(500_000_000),   // 500ms
                Some(1_000_000_000), // 1000ms
                Some(1_500_000_000), // 1500ms
                Some(2_000_000_000), // 2000ms
                Some(2_500_000_000), // 2500ms
                Some(3_000_000_000), // 3000ms
            ],
            vec![1, 2, 3, 4, 5, 6, 7],
        );

        // Apply granularity filtering with 1 second granularity (1000 milliseconds)
        let filtered_data = ts_data.filter_by_granularity(1000);

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];

        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 4);
        assert_eq!(filtered_values.len(), 4);

        // Verify that the correct timestamps (and their corresponding values) are kept
        // multiples of 1000ms (1 second) are kept
        assert_eq!(filtered_timestamps.value(0), 0); // 0ms
        assert_eq!(filtered_timestamps.value(1), 1_000_000_000); // 1000ms
        assert_eq!(filtered_timestamps.value(2), 2_000_000_000); // 2000ms
        assert_eq!(filtered_timestamps.value(3), 3_000_000_000); // 3000ms
        assert_eq!(filtered_values.value(0), 1);
        assert_eq!(filtered_values.value(1), 3);
        assert_eq!(filtered_values.value(2), 5);
        assert_eq!(filtered_values.value(3), 7);
    }

    #[test]
    fn filter_by_time_range_filters_expected_rows() {
        let ts_data = create_timeseries_data(
            vec![
                Some(1_000_000_000),
                Some(2_000_000_000),
                Some(3_000_000_000),
                Some(4_000_000_000),
                Some(5_000_000_000),
            ],
            vec![10, 20, 30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(2_000_000_000, 4_000_000_000);

        assert_eq!(filtered_data.record_batches[0].num_rows(), 3);

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 3);
        assert_eq!(filtered_values.len(), 3);
        assert_eq!(filtered_timestamps.value(0), 2_000_000_000);
        assert_eq!(filtered_timestamps.value(1), 3_000_000_000);
        assert_eq!(filtered_timestamps.value(2), 4_000_000_000);
        assert_eq!(filtered_values.value(0), 20);
        assert_eq!(filtered_values.value(1), 30);
        assert_eq!(filtered_values.value(2), 40);
    }

    #[test]
    fn filter_empty_dataset_returns_empty_result() {
        let ts_data = create_timeseries_data(vec![], vec![]);

        let filtered_data = ts_data.filter_by_time_range(1, 2);

        assert_eq!(filtered_data.record_batches.len(), 1);
        assert_eq!(filtered_data.record_batches[0].num_rows(), 0);
    }

    #[test]
    fn filter_late_starttime_returns_empty_dataset() {
        let ts_data = create_timeseries_data(
            vec![
                Some(1_000_000_000),
                Some(2_000_000_000),
                Some(3_000_000_000),
                Some(4_000_000_000),
                Some(5_000_000_000),
            ],
            vec![10, 20, 30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(6_000_000_000, 7_000_000_000);

        assert!(
            filtered_data.record_batches.is_empty()
                || filtered_data.record_batches[0].num_rows() == 0
        );

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        // make sure we return empty dataset
        assert_eq!(filtered_timestamps.len(), 0);
        assert_eq!(filtered_values.len(), 0);
    }

    #[test]
    fn filter_with_no_starting_rows_returns_partial_data() {
        let ts_data = create_timeseries_data(
            vec![
                Some(3_000_000_000),
                Some(4_000_000_000),
                Some(5_000_000_000),
            ],
            vec![30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(0, 4_000_000_000);

        assert_eq!(filtered_data.record_batches[0].num_rows(), 2);
        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 2);
        assert_eq!(filtered_values.len(), 2);
    }

    #[test]
    fn filter_includes_all_existing_rows_when_range_is_wider() {
        let ts_data = create_timeseries_data(
            vec![
                Some(3_000_000_000),
                Some(4_000_000_000),
                Some(5_000_000_000),
            ],
            vec![30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(1_000_000_000, 6_000_000_000);

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 3);
        assert_eq!(filtered_values.len(), 3);
    }
}
