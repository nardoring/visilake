use arrow::{csv, record_batch::RecordBatch, util::pretty::print_batches};
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

#[cfg(test)]
mod tests {
    use super::*;
    use arrow::array::{BooleanArray, Date32Array, Float64Array, TimestampNanosecondArray};
    use chrono::{NaiveDate, NaiveDateTime};
    use std::convert::TryInto;
    use std::io::Write;
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
}
