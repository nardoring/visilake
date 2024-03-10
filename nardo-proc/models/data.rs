use arrow::{csv, record_batch::RecordBatch, util::pretty::print_batches};
use arrow_csv::reader::Format;
use log::debug;
use parquet::arrow::arrow_reader::ParquetRecordBatchReaderBuilder;
use std::{fs::File, io::Seek, sync::Arc};

#[derive(Debug, Clone)]
pub struct TimeSeriesData {
    record_batch: RecordBatch,
}

impl TimeSeriesData {
    pub fn from_parquet(file_path: &str) -> arrow::error::Result<Self> {
        let file = File::open(file_path).unwrap();
        let builder = ParquetRecordBatchReaderBuilder::try_new(file).unwrap();
        debug!("Converted arrow schema is: {}", builder.schema());

        let mut reader = builder.build().unwrap();
        let record_batch = reader.next().unwrap().unwrap();
        debug!("Read {} records.", record_batch.num_rows());

        Ok(TimeSeriesData { record_batch })
    }

    pub fn to_parquet() {
        // TODO take a new instance of TimeSeriesData representing the dataset
        // and save it as parquet file
        todo!()
    }

    pub fn filter_by_time_range(&self, start_time: i64, end_time: i64) -> Self {
        // TODO filter rows based on the values in a timestamp column
        // Return a new instance of TimeSeriesData representing the filtered dataset
        todo!()
    }

    pub fn filter_by_granularity(&self, grandularity: i32) -> Self {
        // TODO filter rows based on the values in a timestamp column fractionally
        // by the granularity conf
        // Return a new instance of TimeSeriesData representing the filtered dataset
        todo!()
    }
}

pub fn test_csv_to_parquet() {
    let path = format!(
        "{}/infra/mockdata/uk_cities_with_headers.csv",
        env!("CARGO_MANIFEST_DIR")
    );
    let mut file = File::open(path).unwrap();
    let format = Format::default().with_header(true);
    let (schema, _) = format.infer_schema(&mut file, Some(100)).unwrap();
    file.rewind().unwrap();

    let builder = csv::ReaderBuilder::new(Arc::new(schema)).with_format(format);
    let mut csv = builder.build(file).unwrap();
    let batch = csv.next().unwrap().unwrap();
    print_batches(&[batch]).unwrap();
}
