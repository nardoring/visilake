resource "aws_s3_bucket" "data" {
  bucket = "data"
}

resource "aws_s3_bucket" "metadata" {
  bucket = "metadata"
}

resource "aws_s3_object" "data_files" {
  for_each = fileset("./mockdata/datalake", "**/*")
  bucket   = aws_s3_bucket.data.bucket
  key      = each.value
  source   = "./mockdata/datalake/${each.value}"
}

resource "aws_s3_object" "metadata_files" {
  for_each = fileset("./mockdata/metadata/", "**/*")
  bucket   = aws_s3_bucket.metadata.bucket
  key      = each.value
  source   = "./mockdata/metadata/${each.value}"
}

resource "aws_glue_catalog_database" "mock_data_database" {
  name = "mockdata"
}

resource "aws_glue_catalog_database" "mock_procdata_database" {
  name = "procdata"
}

resource "aws_glue_catalog_table" "proc_data" {
  database_name = aws_glue_catalog_database.mock_procdata_database.name
  name          = "dataset2"
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "parquet.compression" = "SNAPPY"
  }

  storage_descriptor {
    location      = "s3://data/dataset2"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"

      parameters = {
        "serialization.format" = 1
      }
    }

    columns {
      name = "unnamed"
      type = "bigint"
    }

    columns {
      name = "area"
      type = "string"
    }

    columns {
      name = "date local"
      type = "int"
    }

    columns {
      name = "1001-fi-50230 units"
      type = "string"
    }

    columns {
      name = "1001-fi-50230"
      type = "double"
    }

    columns {
      name = "1001-fi-50230 1st max value"
      type = "double"
    }

    columns {
      name = "1001-fi-50230 1st max hour"
      type = "bigint"
    }

    columns {
      name = "1001-fi-50230 aqi"
      type = "bigint"
    }

    columns {
      name = "3001-pi-70270 units"
      type = "string"
    }

    columns {
      name = "3001-pi-70270 mean"
      type = "double"
    }

    columns {
      name = "3001-pi-70270 1st max value"
      type = "double"
    }

    columns {
      name = "3001-pi-70270 1st max hour"
      type = "bigint"
    }

    columns {
      name = "3001-pi-70270 aqi"
      type = "bigint"
    }

    columns {
      name = "3003-pic-70690 units"
      type = "string"
    }

    columns {
      name = "3003-pic-70690 mean"
      type = "double"
    }

    columns {
      name = "5001-ai-90230 units"
      type = "string"
    }

    columns {
      name = "5001-ai-90230 mean"
      type = "double"
    }

    columns {
      name = "5001-ai-90230 1st max value"
      type = "double"
    }

    columns {
      name = "5001-ai-90230 1st max hour"
      type = "bigint"
    }

    columns {
      name = "5001-ai-90230 aqi"
      type = "double"
    }

    columns {
      name = "4001-li-80250"
      type = "double"
    }

    columns {
      name = "2001-ti-60210"
      type = "double"
    }

    columns {
      name = "2001-ti-60210 units"
      type = "string"
    }

    columns {
      name = "4001-li-80250 units"
      type = "string"
    }
  }
}

resource "aws_glue_catalog_table" "air_quality_data" {
  database_name = aws_glue_catalog_database.mock_data_database.name
  name          = "dataset1"
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "parquet.compression" = "SNAPPY"
  }

  storage_descriptor {
    location      = "s3://data/dataset1"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"

      parameters = {
        "serialization.format" = 1
      }
    }

    columns {
      name = "unnamed"
      type = "bigint"
    }

    columns {
      name = "state code"
      type = "bigint"
    }

    columns {
      name = "county code"
      type = "bigint"
    }

    columns {
      name = "site num"
      type = "bigint"
    }

    columns {
      name = "address"
      type = "string"
    }

    columns {
      name = "state"
      type = "string"
    }

    columns {
      name = "county"
      type = "string"
    }

    columns {
      name = "city"
      type = "string"
    }

    columns {
      name = "date local"
      type = "int"
    }

    columns {
      name = "no2 units"
      type = "string"
    }

    columns {
      name = "no2 mean"
      type = "double"
    }

    columns {
      name = "no2 1st max value"
      type = "double"
    }

    columns {
      name = "no2 1st max hour"
      type = "bigint"
    }

    columns {
      name = "no2 aqi"
      type = "bigint"
    }

    columns {
      name = "o3 units"
      type = "string"
    }

    columns {
      name = "o3 mean"
      type = "double"
    }

    columns {
      name = "o3 1st max value"
      type = "double"
    }

    columns {
      name = "o3 1st max hour"
      type = "bigint"
    }

    columns {
      name = "o3 aqi"
      type = "bigint"
    }

    columns {
      name = "so2 units"
      type = "string"
    }

    columns {
      name = "so2 mean"
      type = "double"
    }

    columns {
      name = "so2 1st max value"
      type = "double"
    }

    columns {
      name = "so2 1st max hour"
      type = "bigint"
    }

    columns {
      name = "so2 aqi"
      type = "double"
    }

    columns {
      name = "co units"
      type = "string"
    }

    columns {
      name = "co mean"
      type = "double"
    }

    columns {
      name = "co 1st max value"
      type = "double"
    }

    columns {
      name = "co 1st max hour"
      type = "bigint"
    }

    columns {
      name = "co aqi"
      type = "double"
    }
  }
}
