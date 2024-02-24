/*
 * datalake.tf
 * AWS Data Lake Configuration
 *
 * This Terraform configuration sets up a simple yet efficient data lake on AWS,
 * leveraging AWS Wrangler for data ingestion, Amazon S3 for data storage,
 * AWS Glue for data cataloging, and Amazon Athena for querying the data.
 *
 * Resources Created:
 * - TODO AWS S3 Buckets: For storing datasets in Parquet format.
 * - TODO AWS Glue Data Catalog: For cataloging datasets and facilitating schema discovery.
 * - TODO AWS Glue Crawler: To automatically discover and catalog data stored in S3.
 * - TODO Amazon Athena: For SQL-based querying of datasets directly from S3.
 * - TODO ? IAM Roles and Policies: For secure access management across services.
 * - TODO ? Encryption Keys: For data encryption at rest within S3 buckets.
 *
 * Design Decisions:
 * - Parquet Format: Chosen for storage due to its columnar compression,
 *     which enhances query performance and reduces costs.
 * - AWS Wrangler: Simplifies data ingestion from various sources into S3,
 *     facilitating the data lake's scalability and flexibility.
 * - Data Cataloging: Automated with AWS Glue Crawler to reduce manual
 *     efforts in schema management and accelerate data readiness for analytics.
 *
 */

### S3 ###
# TODO Create more buckets for datalake, job info, etc.
resource "aws_s3_bucket" "data_lake_bucket" {
  bucket = "data-lake-bucket-${random_string.bucket_suffix.result}"

  tags = {
    Environment = "DataLake"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_kms_key" "data_lake_key" {
  description             = "This key is used to encrypt bucket objects"
  deletion_window_in_days = 30
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.data_lake_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}


resource "aws_s3_bucket_acl" "data_lake" {
  bucket = aws_s3_bucket.data_lake_bucket.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "versioning_data_lake" {
  bucket = aws_s3_bucket.data_lake_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

### Logging ###

resource "aws_s3_bucket" "data_lake_log_bucket" {
  bucket = "data-lake-log-bucket-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_acl" "data_lake_log_bucket_acl" {
  bucket = aws_s3_bucket.data_lake_log_bucket.id
  acl    = "log-delivery-write"
}

resource "aws_s3_bucket_logging" "data_lake_bucket" {
  bucket = aws_s3_bucket.data_lake_bucket.id

  target_bucket = aws_s3_bucket.data_lake_log_bucket.id
  target_prefix = "log/"
}

### GLUE ###

resource "aws_glue_catalog_table" "aws_glue_catalog_table" {
  name          = "job-catalog-table"
  database_name = "job-catalog-database"

  table_type = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "parquet.compression" = "SNAPPY"
  }

  storage_descriptor {
    location      = aws_s3_bucket.data_lake_bucket.arn
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "my-stream"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"

      parameters = {
        "serialization.format" = 1
      }
    }

    columns {
      name    = "requestID"
      type    = "string"
      comment = ""
    }
    columns {
      name    = "id"
      type    = "string"
      comment = ""
    }

    columns {
      name    = "creationDate"
      type    = "number"
      comment = ""
    }
    columns {
      name    = "useCaseStatus"
      type    = "string"
      comment = ""
    }
    columns {
      name    = "useCaseName"
      type    = "string"
      comment = ""
    }
    columns {
      name    = "useCaseDescription"
      type    = "string"
      comment = ""
    }
    columns {
      name    = "author"
      type    = "string"
      comment = ""
    }
    columns {
      name = "analysisTypes"
      type = "string" ## ????
      # type    = "struct<my_nested_string:string>" ## ????
      comment = ""
    }
    columns {
      name    = "powerBILink"
      type    = "string"
      comment = ""
    }
  }
}

resource "aws_glue_catalog_database" "job" {
  name        = "job-catalog-database"
  description = "A placeholder example catalog db for testing"

  create_table_default_permission {
    permissions = ["SELECT"]

    principal {
      data_lake_principal_identifier = "IAM_ALLOWED_PRINCIPALS"
    }
  }
}

resource "aws_glue_crawler" "nardo_crawler" {
  database_name = aws_glue_catalog_database.job.name
  name          = "nardo_crawler"
  role          = aws_iam_role.glue_crawler_role.arn

  dynamodb_target {
    path = "mockRequests"
  }
}

### Glue Crawler ###

resource "aws_glue_crawler" "data_lake_crawler" {
  name          = "data-lake-crawler"
  database_name = aws_glue_catalog_database.job.name
  schedule      = "cron(0 1 * * ? *)"
  role          = aws_iam_role.glue_crawler_role.arn
  # tags          = var.tags # TODO

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  configuration = jsonencode(
    {
      Grouping = {
        TableGroupingPolicy = "CombineCompatibleSchemas"
      }
      CrawlerOutput = {
        Partitions = { AddOrUpdateBehavior = "InheritFromTable" }
      }
      Version = 1
    }
  )

  s3_target {
    path = "s3://${aws_s3_bucket.data_lake_bucket.bucket}"
  }
}

resource "aws_iam_role" "glue_crawler_role" {
  name = "data_lake_glue_crawler_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "glue_crawler_policy" {
  name = "data_lake_glue_crawler_policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:*",
          "glue:GetDatabase",
          "glue:GetDatabases",
          "glue:GetTable",
          "glue:GetTables",
          "glue:UpdateTable",
          "glue:CreateTable",
          "glue:DeleteTable",
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
        ]
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_crawler_policy_attachment" {
  role       = aws_iam_role.glue_crawler_role.name
  policy_arn = aws_iam_policy.glue_crawler_policy.arn
}
