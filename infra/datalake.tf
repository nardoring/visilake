resource "aws_s3_bucket" "data_lake" {
  bucket = "data-lake"
}

resource "aws_s3_object" "data_files" {
  for_each = fileset("./mockdata/", "**/*")
  bucket   = aws_s3_bucket.data_lake.bucket
  key      = each.value
  source   = "./mockdata/${each.value}"
}

resource "aws_glue_catalog_database" "mock_data_database" {
  name = "mockdata"
}

resource "aws_glue_catalog_table" "hospital_beds" {
  database_name = aws_glue_catalog_database.mock_data_database.name
  name          = "hospital_beds"
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    has_encrypted_data = "false"
    classification     = "json"
    typeOfData         = "file"
  }

  storage_descriptor {
    location      = "s3://data-lake/rearc-usa-hospital-beds"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
      parameters = {
        paths = "BED_UTILIZATION,CNTY_FIPS,COUNTY_NAME,FIPS,HOSPITAL_NAME,HOSPITAL_TYPE,HQ_ADDRESS,HQ_ADDRESS1,HQ_CITY,HQ_STATE,HQ_ZIP_CODE,NUM_ICU_BEDS,NUM_LICENSED_BEDS,NUM_STAFFED_BEDS,OBJECTID,Potential_Increase_In_Bed_Capac,STATE_FIPS,STATE_NAME,latitude,longtitude"
      }
    }

    columns {
      name    = "objectid"
      type    = "int"
      comment = "unique id for the record"
    }

    columns {
      name = "hospital_name"
      type = "string"
    }

    columns {
      name    = "hospital_type"
      type    = "string"
      comment = "Short Term Acute Care Hospital (STAC), Critical Access Hospital (CAH), Long Term Acute Care Hospitals, Children’s Hospitals, Veteran's Affairs (VA) Hospital or Department of Defense (DoD) Hospital"
    }

    columns {
      name = "hq_address"
      type = "string"
    }

    columns {
      name = "hq_address1"
      type = "string"
    }

    columns {
      name = "hq_city"
      type = "string"
    }

    columns {
      name = "hq_state"
      type = "string"
    }

    columns {
      name = "hq_zip_code"
      type = "string"
    }

    columns {
      name = "county_name"
      type = "string"
    }

    columns {
      name = "state_name"
      type = "string"
    }

    columns {
      name = "state_fips"
      type = "string"
    }

    columns {
      name = "cnty_fips"
      type = "string"
    }

    columns {
      name = "fips"
      type = "string"
    }

    columns {
      name    = "num_licensed_beds"
      type    = "int"
      comment = "maximum number of beds for which a hospital holds a license to operate"
    }

    columns {
      name    = "num_staffed_beds"
      type    = "int"
      comment = "adult bed, pediatric bed, birthing room, or newborn ICU bed (excluding newborn bassinets) maintained in a patient care area for lodging patients in acute, long term, or domiciliary areas of the hospital."
    }

    columns {
      name    = "num_icu_beds"
      type    = "int"
      comment = "ICU beds, burn ICU beds, surgical ICU beds, premature ICU beds, neonatal ICU beds, pediatric ICU beds, psychiatric ICU beds, trauma ICU beds, and Detox ICU beds"
    }

    columns {
      name    = "bed_utilization"
      type    = "double"
      comment = "calculated based on metrics from the Medicare Cost Report: Bed Utilization Rate = Total Patient Days (excluding nursery days)/Bed Days Available"
    }

    columns {
      name    = "potential_increase_in_bed_capac"
      type    = "int"
      comment = "computed by subtracting 'Number of Staffed Beds from Number of Licensed beds' (Licensed Beds – Staffed Beds). This would provide insights into scenario planning for when staff can be shifted around to increase available bed capacity as needed."
    }

    columns {
      name    = "latitude"
      type    = "double"
      comment = "hospital location (latitude)"
    }

    columns {
      name    = "longtitude"
      type    = "double"
      comment = "hospital location (longitude)"
    }
  }
}

resource "aws_glue_catalog_table" "air_quality_data" {
  database_name = aws_glue_catalog_database.mock_data_database.name
  name          = "air_quality"
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "parquet.compression" = "SNAPPY"
  }

  storage_descriptor {
    location      = "s3://data-lake/air-quality"
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
