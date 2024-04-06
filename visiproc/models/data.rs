#![allow(dead_code)]
use arrow::{
    array::{BooleanArray, TimestampMillisecondArray},
    compute::filter_record_batch,
    csv,
    datatypes::{DataType, Field, Schema, TimeUnit},
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
    schema: Arc<Schema>,
    record_batches: Vec<RecordBatch>,
}

impl TimeSeriesData {
    /// Constructs a `TimeSeriesData` instance from a Parquet file on disk.
    ///
    /// # Arguments
    ///
    /// * `infile` - A string slice that holds the path to the input Parquet file.
    ///
    /// # Returns
    ///
    /// A result containing either a `TimeSeriesData` instance populated with the data from the input file
    /// or an error if the operation fails.
    pub fn from_parquet(infile: &str) -> arrow::error::Result<Self> {
        let file = File::open(infile)?;
        let builder = ParquetRecordBatchReaderBuilder::try_new(file)?;
        debug!("Converted arrow schema is: {:#?}", builder.schema());

        let schema = builder.schema().clone();

        let mut reader = builder.build()?;

        let mut record_batches = Vec::new();
        while let Some(Ok(batch)) = reader.next() {
            record_batches.push(batch);
        }

        Ok(TimeSeriesData {
            schema,
            record_batches,
        })
    }

    /// Constructs a `TimeSeriesData` instance from a CSV file on disk, inferring the schema from the CSV headers.
    ///
    /// # Arguments
    ///
    /// * `infile` - A string slice that holds the path to the input CSV file.
    ///
    /// # Returns
    ///
    /// A result containing either a `TimeSeriesData` instance populated with the data from the input file
    /// or an error if the operation fails. This function assumes the first row of the CSV contains headers that define the schema.
    pub fn from_csv(infile: &str) -> Result<Self> {
        let mut file = File::open(&infile)?;
        let format = Format::default().with_header(true);
        let (schema, _) = format.infer_schema(&mut file, Some(100))?;
        let schema_arc = Arc::new(schema);
        file.seek(std::io::SeekFrom::Start(0))?;

        let builder = csv::ReaderBuilder::new(schema_arc.clone())
            .with_format(format)
            .with_batch_size(512);
        let mut csv_reader = builder.build(file)?;

        let mut record_batches = Vec::new();

        while let Some(Ok(batch)) = csv_reader.next() {
            record_batches.push(batch);
        }

        debug!(
            "Read {} batches to parquet from {}",
            record_batches.len(),
            infile
        );

        Ok(TimeSeriesData {
            schema: schema_arc,
            record_batches,
        })
    }

    /// Writes the contained `TimeSeriesData` to disk in Parquet format.
    ///
    /// # Arguments
    ///
    /// * `outfile` - A string slice that holds the path where the output Parquet file will be written.
    ///
    /// # Returns
    ///
    /// A result indicating the success or failure of the write operation.
    pub fn to_parquet(&self, outfile: &str) -> Result<()> {
        let file = File::create(outfile)?;
        let writer_props = WriterProperties::builder()
            .set_compression(Compression::SNAPPY)
            .build();
        let mut writer = ArrowWriter::try_new(file, self.schema.clone(), Some(writer_props))?;

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

    /// Filters the record batches based on a provided filter function, supporting dynamic identification of temporal fields.
    ///
    /// # Arguments
    ///
    /// * `filter_fn` - A closure that takes a timestamp in milliseconds and returns a boolean indicating whether the record should be included.
    ///
    /// # Returns
    ///
    /// A result containing either a new `TimeSeriesData` instance with the filtered record batches
    /// or an error if the operation fails.
    fn filter_record_batches<F>(&self, filter_fn: F) -> Result<Self>
    where
        F: Fn(i64) -> bool + Copy,
    {
        let filtered_batches: Vec<RecordBatch> = self
            .record_batches
            .iter()
            .map(|batch| {
                let temporal_field_index = batch
                    .schema()
                    .fields()
                    .iter()
                    .position(|field| field.data_type().is_temporal())
                    .ok_or_else(|| eyre::eyre!("Temporal column not found"))?;

                let temporal_col = batch
                    .column(temporal_field_index)
                    .as_any()
                    .downcast_ref::<TimestampMillisecondArray>()
                    .ok_or_else(|| eyre::eyre!("Temporal column has incorrect type"))?;

                let mask = temporal_col
                    .iter()
                    .map(|maybe_time| maybe_time.map(|time| filter_fn(time)))
                    .collect::<BooleanArray>();

                filter_record_batch(batch, &mask)
                    .map_err(|_| eyre::eyre!("Failed to filter record batch"))
            })
            .collect::<Result<Vec<RecordBatch>>>()?;

        Ok(TimeSeriesData {
            schema: self.schema.clone(),
            record_batches: filtered_batches,
        })
    }

    /// Filters the record batches to include only those records that fall within a specified time range.
    ///
    /// # Arguments
    ///
    /// * `start_time` - The start of the time range in milliseconds.
    /// * `end_time` - The end of the time range in milliseconds.
    ///
    /// # Returns
    ///
    /// A result containing either a new `TimeSeriesData` instance with the filtered record batches
    /// or an error if the operation fails.
    pub fn filter_by_time_range(&self, start_time: i64, end_time: i64) -> Result<Self> {
        self.filter_record_batches(move |time| time >= start_time && time <= end_time)
    }

    /// Filters the record batches to adjust the time between sampled events according to the specified granularity,
    /// taking into account the datatype of the temporal column for granularity adjustment.
    ///
    /// # Arguments
    ///
    /// * `granularity` - The desired granularity in milliseconds.
    ///
    /// # Returns
    ///
    /// A result containing either a new `TimeSeriesData` instance with the filtered record batches
    /// or an error if the operation fails.
    pub fn filter_by_granularity(&self, granularity: i64) -> Result<Self> {
        let data_type = self
            .schema
            .fields()
            .iter()
            .find_map(|field| {
                if field.data_type().is_temporal() {
                    Some(field.data_type())
                } else {
                    None
                }
            })
            .expect("Temporal column not found");

        let conversion_factor = match data_type {
            DataType::Timestamp(unit, _) => match unit {
                TimeUnit::Second => 1_000,
                TimeUnit::Millisecond => 1,
                TimeUnit::Microsecond => 1, // just going to ignore <ms, lol
                TimeUnit::Nanosecond => 1,
            },
            DataType::Date32 => 86_400_000, // days to ms
            DataType::Date64 => 1,          // represented in ms
            _ => unimplemented!("Unsupported temporal type"),
        };

        // Adjust granularity based on the data type
        let adjusted_granularity = granularity * conversion_factor;

        self.filter_record_batches(move |time| time % adjusted_granularity == 0)
    }

    /// Retrieves a list of field names from the schema.
    ///
    /// # Returns
    ///
    /// A vector containing the names of all fields in the schema.
    pub fn field_names(&self) -> Vec<String> {
        self.schema
            .fields()
            .iter()
            .map(|f| f.name().clone())
            .collect()
    }

    /// Checks if a field with the specified name exists in the schema.
    ///
    /// # Arguments
    ///
    /// * `field_name` - The name of the field to check.
    ///
    /// # Returns
    ///
    /// `true` if the field exists in the schema, `false` otherwise.
    pub fn has_field(&self, field_name: &str) -> bool {
        self.schema.fields().iter().any(|f| f.name() == field_name)
    }

    /// Retrieves the data type of a field by its name.
    ///
    /// # Arguments
    ///
    /// * `field_name` - The name of the field.
    ///
    /// # Returns
    ///
    /// An option containing the `DataType` of the field if it exists, or `None` if the field is not found in the schema.
    pub fn field_type(&self, field_name: &str) -> Option<DataType> {
        self.schema
            .fields()
            .iter()
            .find(|f| f.name() == field_name)
            .map(|f| f.data_type().clone())
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

        // Milliseconds since Unix epoch (for TimestampMillisecondArray):

        //     1970-01-01T00:00:00: 0 milliseconds
        //     2020-11-08T01:00:00: 1.6047972e+18 milliseconds
        //     1969-11-08T02:00:00: -4658400000000000 milliseconds
        //     1990-01-01T03:00:00: 6.311628e+17 milliseconds
        // Date32Array for days since Unix epoch

        if let Some(c_datetime) = batch
            .column(5)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
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
                DataType::Timestamp(TimeUnit::Millisecond, None),
                false,
            ),
            Field::new("value", DataType::Int64, false),
        ]);

        let timestamp_array = TimestampMillisecondArray::from(timestamps);
        let value_array = Int64Array::from(values);

        let batch = RecordBatch::try_new(
            Arc::new(schema.clone()),
            vec![
                Arc::new(timestamp_array) as ArrayRef,
                Arc::new(value_array) as ArrayRef,
            ],
        )
        .expect("Failed to create record batch");

        TimeSeriesData {
            schema: Arc::new(schema),
            record_batches: vec![batch],
        }
    }

    #[test]
    fn filter_by_granularity_filters() {
        let ts_data = create_timeseries_data(
            vec![
                Some(0),
                Some(500),
                Some(1_000),
                Some(1_500),
                Some(2_000),
                Some(2_500),
                Some(3_000),
            ],
            vec![1, 2, 3, 4, 5, 6, 7],
        );

        // Apply granularity filtering with 1 second granularity (1000 milliseconds)
        let filtered_data = ts_data.filter_by_granularity(1000).unwrap();

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];

        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 4);
        assert_eq!(filtered_values.len(), 4);

        // Verify that the correct timestamps (and their corresponding values) are kept
        assert_eq!(filtered_timestamps.value(0), 0);
        assert_eq!(filtered_timestamps.value(1), 1_000);
        assert_eq!(filtered_timestamps.value(2), 2_000);
        assert_eq!(filtered_timestamps.value(3), 3_000);
        assert_eq!(filtered_values.value(0), 1);
        assert_eq!(filtered_values.value(1), 3);
        assert_eq!(filtered_values.value(2), 5);
        assert_eq!(filtered_values.value(3), 7);
    }

    #[test]
    fn test_filter_by_granularity_various_granularities() {
        let granularities = vec![
            1,
            5,
            10,
            100,
            1000,
            1000 * 60,
            1000 * 60 * 60,
            1000 * 60 * 60 * 24,
        ];

        let ts_data = create_timeseries_data(
            vec![
                Some(0),           // 0ms
                Some(500),         // 0.5 seconds
                Some(1_000),       // 1 second
                Some(1_500),       // 1.5 seconds
                Some(2_000),       // 2 seconds
                Some(3_600_000),   // 1 hour
                Some(86_400_000),  // 1 day
                Some(172_800_000), // 2 day
            ],
            vec![1, 2, 3, 4, 5, 6, 7, 8],
        );

        for granularity in granularities {
            let filtered_data = ts_data.filter_by_granularity(granularity).unwrap();

            let expected_num_records: usize = ts_data
                .record_batches
                .iter()
                .map(|batch| {
                    let timestamp_col = batch
                        .column(0)
                        .as_any()
                        .downcast_ref::<TimestampMillisecondArray>()
                        .unwrap();
                    timestamp_col
                        .iter()
                        .filter_map(|maybe_time| maybe_time)
                        .filter(|&time| time % granularity == 0)
                        .count()
                })
                .sum();

            assert_eq!(
                filtered_data
                    .record_batches
                    .iter()
                    .map(|batch| batch.num_rows())
                    .sum::<usize>(),
                expected_num_records,
                "Granularity: {}ms did not filter correctly",
                granularity
            );
        }
    }

    #[test]
    fn filter_by_time_range_filters_expected_rows() {
        let ts_data = create_timeseries_data(
            vec![
                Some(1_000),
                Some(2_000),
                Some(3_000),
                Some(4_000),
                Some(5_000),
            ],
            vec![10, 20, 30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(2_000, 4_000).unwrap();

        assert_eq!(filtered_data.record_batches[0].num_rows(), 3);

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 3);
        assert_eq!(filtered_values.len(), 3);
        assert_eq!(filtered_timestamps.value(0), 2_000);
        assert_eq!(filtered_timestamps.value(1), 3_000);
        assert_eq!(filtered_timestamps.value(2), 4_000);
        assert_eq!(filtered_values.value(0), 20);
        assert_eq!(filtered_values.value(1), 30);
        assert_eq!(filtered_values.value(2), 40);
    }

    #[test]
    fn filter_empty_dataset_returns_empty_result() {
        let ts_data = create_timeseries_data(vec![], vec![]);

        let filtered_data = ts_data.filter_by_time_range(1, 2).unwrap();

        assert_eq!(filtered_data.record_batches.len(), 1);
        assert_eq!(filtered_data.record_batches[0].num_rows(), 0);
    }

    #[test]
    fn filter_late_starttime_returns_empty_dataset() {
        let ts_data = create_timeseries_data(
            vec![
                Some(1_000),
                Some(2_000),
                Some(3_000),
                Some(4_000),
                Some(5_000),
            ],
            vec![10, 20, 30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(6_000, 7_000).unwrap();

        assert!(
            filtered_data.record_batches.is_empty()
                || filtered_data.record_batches[0].num_rows() == 0
        );

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
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
            vec![Some(3_000), Some(4_000), Some(5_000)],
            vec![30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(0, 4_000).unwrap();

        assert_eq!(filtered_data.record_batches[0].num_rows(), 2);
        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
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
            vec![Some(3_000), Some(4_000), Some(5_000)],
            vec![30, 40, 50],
        );

        let filtered_data = ts_data.filter_by_time_range(1_000, 6_000).unwrap();

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];
        let filtered_timestamps = filtered_batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
            .unwrap();
        let filtered_values = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        assert_eq!(filtered_timestamps.len(), 3);
        assert_eq!(filtered_values.len(), 3);
    }

    #[test]
    fn filter_by_temporal_field_identifies_and_filters_correctly() {
        // Create a schema with various field types, including a temporal one not named "timestamp"
        let schema = Schema::new(vec![
            Field::new("id", DataType::Int64, false),
            Field::new(
                "maybe_a_time",
                DataType::Timestamp(TimeUnit::Millisecond, None),
                false,
            ),
            Field::new("value", DataType::Float64, false),
        ]);

        let event_times = vec![
            Some(1_000),
            Some(2_000),
            Some(3_000),
            Some(4_000),
            Some(5_000),
        ];

        // Corresponding IDs and values
        let ids = vec![Some(1), Some(2), Some(3), Some(4), Some(5)];
        let values = vec![Some(10.0), Some(20.0), Some(30.0), Some(40.0), Some(50.0)];

        let event_time_array = TimestampMillisecondArray::from(event_times);
        let id_array = Int64Array::from(ids);
        let value_array = Float64Array::from(values);

        let batch = RecordBatch::try_new(
            Arc::new(schema.clone()),
            vec![
                Arc::new(id_array) as ArrayRef,
                Arc::new(event_time_array) as ArrayRef,
                Arc::new(value_array) as ArrayRef,
            ],
        )
        .expect("Failed to create record batch");

        let ts_data = TimeSeriesData {
            schema: Arc::new(schema),
            record_batches: vec![batch],
        };

        // Apply filtering based on the "maybe_a_time" column
        let filter_fn = |time: i64| time >= 2_000 && time <= 4_000;
        let filtered_data = ts_data.filter_record_batches(filter_fn).unwrap();

        assert_eq!(filtered_data.record_batches.len(), 1);
        let filtered_batch = &filtered_data.record_batches[0];

        let filtered_event_times = filtered_batch
            .column(1)
            .as_any()
            .downcast_ref::<TimestampMillisecondArray>()
            .unwrap();

        // Verify that only timestamps within the specified range (2 to 4 seconds) are included
        assert_eq!(filtered_event_times.len(), 3);
        assert_eq!(filtered_event_times.value(0), 2_000);
        assert_eq!(filtered_event_times.value(1), 3_000);
        assert_eq!(filtered_event_times.value(2), 4_000);
    }
}
