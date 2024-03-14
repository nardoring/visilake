use arrow::{
    array::{ArrayRef, BooleanArray, TimestampNanosecondArray},
    compute::filter_record_batch,
    csv,
    datatypes::{DataType, Field, Schema},
    record_batch::RecordBatch,
    util::pretty::print_batches,
};
use arrow_csv::reader::Format;
use eyre::Result;
use log::{debug, info};
use parquet::{
    arrow::{arrow_reader::ParquetRecordBatchReaderBuilder, ArrowWriter},
    basic::Compression,
    file::properties::WriterProperties,
};
use std::{fs::File, io::Seek, sync::Arc};
use tempfile::tempfile;

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

                filter_record_batch(batch, &mask).expect("Failed to filter record batch")
            })
            .collect();

        TimeSeriesData {
            record_batches: filtered_batches,
        }
    }

    pub fn filter_by_granularity(&self, grandularity: i32) -> Self {
        // TODO filter rows based on the values in a timestamp column fractionally
        // by the granularity conf
        // Return a new instance of TimeSeriesData representing the filtered dataset
        todo!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use arrow::{
        array::{BooleanArray, Date32Array, Float64Array, Int64Array, TimestampNanosecondArray},
        // datatypes::{DataType, Field, Schema},
        datatypes::{DataType, Field, Schema, TimeUnit},
        record_batch::RecordBatch,
    };
    use chrono::{NaiveDate, NaiveDateTime};
    use std::convert::TryInto;
    use std::io::Write;
    use std::sync::Arc;
    use tempfile::NamedTempFile;

    #[test]
    fn test_from_csv_variety_types() {
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

    #[test]
    fn test_filter_by_time_range() {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                // Timestamp to include TimeUnit and optional timezone
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamps = vec![Some(1), Some(2), Some(3), Some(4), Some(5)];
        let timestamps_array = TimestampNanosecondArray::from(timestamps);

        let values = Int64Array::from(vec![10, 20, 30, 40, 50]);

        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamps_array) as ArrayRef,
                Arc::new(values) as ArrayRef,
            ],
        )
        .unwrap();

        let ts_data = TimeSeriesData {
            record_batches: vec![batch],
        };

        // start and end are inclusive
        let start_time = 2;
        let end_time = 4;
        let filtered_data = ts_data.filter_by_time_range(start_time, end_time);

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

        for i in 0..filtered_timestamps.len() {
            let timestamp_value = filtered_timestamps.value(i);
            assert!(timestamp_value >= start_time && timestamp_value <= end_time);
            assert_eq!(filtered_values.value(i), (i as i64 + 1) * 10 + 10);
        }
    }

    #[test]
    fn test_filter_by_timestamp_range() {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                // Timestamp to include TimeUnit and optional timezone
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamps = TimestampNanosecondArray::from(vec![
            Some(1_000_000_000), // 1 second
            Some(2_000_000_000), // 2 seconds
            Some(3_000_000_000), // 3 seconds
            Some(4_000_000_000), // 4 seconds
            Some(5_000_000_000), // 5 seconds
        ]);
        let values = Int64Array::from(vec![10, 20, 30, 40, 50]);

        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamps) as ArrayRef,
                Arc::new(values) as ArrayRef,
            ],
        )
        .unwrap();

        let ts_data = TimeSeriesData {
            record_batches: vec![batch],
        };

        let start_time = 2_000_000_000;
        // let start_time = 1_000_000_001; // note this would also pass this test
        let end_time = 4_000_000_000;

        let filtered_data = ts_data.filter_by_time_range(start_time, end_time);

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
    fn test_filter_empty_dataset() {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        // Create columns with zero rows to match the schema
        let timestamps = TimestampNanosecondArray::from(vec![None; 0]); // Zero-length array
        let values = Int64Array::from(vec![None; 0]); // Zero-length array

        // Create a RecordBatch with our schema and zero rows
        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamps) as ArrayRef,
                Arc::new(values) as ArrayRef,
            ],
        )
        .expect("Failed to create empty RecordBatch");

        let ts_data = TimeSeriesData {
            record_batches: vec![batch],
        };

        let filtered_data = ts_data.filter_by_time_range(1, 2);

        assert_eq!(filtered_data.record_batches.len(), 1);
        assert_eq!(filtered_data.record_batches[0].num_rows(), 0);
    }

    #[test]
    fn test_filter_late_starttime() {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                // Timestamp to include TimeUnit and optional timezone
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamps = TimestampNanosecondArray::from(vec![
            Some(1_000_000_000), // 1 second
            Some(2_000_000_000), // 2 seconds
            Some(3_000_000_000), // 3 seconds
            Some(4_000_000_000), // 4 seconds
            Some(5_000_000_000), // 5 seconds
        ]);
        let values = Int64Array::from(vec![10, 20, 30, 40, 50]);

        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamps) as ArrayRef,
                Arc::new(values) as ArrayRef,
            ],
        )
        .unwrap();

        let ts_data = TimeSeriesData {
            record_batches: vec![batch],
        };

        // start time is later in time than end time
        let filtered_data = ts_data.filter_by_time_range(4_000_000_000, 3_000_000_000);

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
    fn test_filter_no_start_rows() {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                // Timestamp to include TimeUnit and optional timezone
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamps = TimestampNanosecondArray::from(vec![
            Some(3_000_000_000), // 3 seconds
            Some(4_000_000_000), // 4 seconds
            Some(5_000_000_000), // 5 seconds
        ]);
        let values = Int64Array::from(vec![30, 40, 50]);

        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamps) as ArrayRef,
                Arc::new(values) as ArrayRef,
            ],
        )
        .unwrap();

        let ts_data = TimeSeriesData {
            record_batches: vec![batch],
        };

        let start_time = 0_000_000_000;
        let end_time = 4_000_000_000;

        let filtered_data = ts_data.filter_by_time_range(start_time, end_time);

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
    fn test_filter_all_existing_rows() {
        let schema = Schema::new(vec![
            Field::new(
                "timestamp",
                // Timestamp to include TimeUnit and optional timezone
                DataType::Timestamp(TimeUnit::Nanosecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamps = TimestampNanosecondArray::from(vec![
            Some(3_000_000_000), // 3 seconds
            Some(4_000_000_000), // 4 seconds
            Some(5_000_000_000), // 5 seconds
        ]);
        let values = Int64Array::from(vec![30, 40, 50]);

        let batch = RecordBatch::try_new(
            Arc::new(schema),
            vec![
                Arc::new(timestamps) as ArrayRef,
                Arc::new(values) as ArrayRef,
            ],
        )
        .unwrap();

        let ts_data = TimeSeriesData {
            record_batches: vec![batch],
        };

        let start_time = 0_000_000_000;
        let end_time = 10_000_000_000;

        let filtered_data = ts_data.filter_by_time_range(start_time, end_time);

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
