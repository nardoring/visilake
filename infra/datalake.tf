/*
 * datalake.tf
 * AWS Data Lake Configuration
 *
 * This Terraform configuration sets up a simple yet efficient data lake on AWS,
 * leveraging AWS Wrangler for data ingestion, Amazon S3 for data storage,
 * AWS Glue for data cataloging, and Amazon Athena for querying the data.
 *
 * Resources Created:
 * - AWS S3 Buckets: For storing datasets in Parquet format.
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
resource "aws_s3_bucket" "data_lake_bucket" {
  bucket = "data-lake-bucket-${random_string.bucket_suffix.result}"

  tags = {
    Environment = "DataLake-dev"
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

# This will currently replicate what we have in dynamoDB into a GLUE db
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

resource "aws_glue_catalog_table" "job_catalog_table" {
  name          = "job-catalog-table"
  description   = "Catalog table for the job's metadata"
  database_name = aws_glue_catalog_database.job.name
}


resource "aws_glue_catalog_database" "data" {
  name        = "data-catalog-database"
  description = "A testing catalog db"

  create_table_default_permission {
    permissions = ["SELECT"]

    principal {
      data_lake_principal_identifier = "IAM_ALLOWED_PRINCIPALS"
    }
  }
}

resource "aws_glue_catalog_table" "data_catalog_table" {
  name          = "data-catalog-table"
  description   = "Catalog table for the data which we process' metadata"
  database_name = aws_glue_catalog_database.data.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "parquet.compression" = "SNAPPY"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.data_lake_bucket.bucket}"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "my-stream"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"

      parameters = {
        "serialization.format" = 1
      }
    }

    # TODO Define schema if needed, otherwise, Glue can infer schema during a crawl
    # We should validate this though, have seen issues with Glue determining the correct data types
    # columns {
    #   name    = "requestID"
    #   type    = "string"
    #   comment = ""
    # }
  }
}


### Glue Crawler ###
### TODO This doesn't seem to work on Localstack, I image because my actual AWS account is not connected
### for Glue Services
### localstack glue API docs:
### https://docs.localstack.cloud/references/coverage/coverage_glue/
###
### ref: https://docs.aws.amazon.com/glue/latest/dg/add-crawler.html#crawler-s3-folder-table-partition
### ref: https://docs.aws.amazon.com/athena/latest/ug/glue-best-practices.html#schema-crawlers-data-sources

resource "aws_glue_crawler" "mock_requests_crawler" {
  database_name = aws_glue_catalog_database.job.name
  description   = "Crawler for the metadata(App produced data: requests table, intermediary tables, etc.)"
  name          = "mock-requests-crawler"
  role          = aws_iam_role.glue_crawler_role.arn

  tags = {
    Environment = "DataLake-dev"
  }

  dynamodb_target {
    path = aws_dynamodb_table.mockRequests.name
  }
}

resource "aws_glue_crawler" "data_lake_crawler" {
  name          = "data-lake-crawler"
  description   = "Crawler for the non-metadata(Production data, etc.)"
  database_name = aws_glue_catalog_database.data.name
  schedule      = "cron(0 1 * * ? *)"
  role          = aws_iam_role.glue_crawler_role.arn
  tags = {
    Environment = "DataLake-dev"
  }

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
  name = "data-lake-glue-crawler-role"

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
  name = "data-lake-glue-crawler-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [ # TODO IAM Policy EVAL, wide open for now
          "athena:*",
          "dynamodb:*",
          "glue:*",
          "s3:*",
          # "glue:GetDatabase",
          # "glue:GetDatabases",
          # "glue:GetTable",
          # "glue:GetTables",
          # "glue:UpdateTable",
          # "glue:CreateTable",
          # "glue:DeleteTable",
          # "s3:GetObject",
          # "s3:PutObject",
          # "s3:ListBucket",
        ]
        Resource = "*"
      },
    ]
  })
}


# # FUTURE Localstack does not support Glue encryption
# resource "aws_kms_key" "glue_key" {
#   description             = "This key is used to encrypt bucket objects"
#   deletion_window_in_days = 30
# }

# resource "aws_glue_data_catalog_encryption_settings" "glue_encryption" {
#   data_catalog_encryption_settings {
#     connection_password_encryption {
#       aws_kms_key_id                       = aws_kms_key.glue_key.arn
#       return_connection_password_encrypted = true
#     }

#     encryption_at_rest {
#       catalog_encryption_mode = "SSE-KMS"
#       sse_aws_kms_key_id      = aws_kms_key.glue_key.arn
#     }
#   }
# }

resource "aws_glue_security_configuration" "data_lake_glue_security" {
  name = "data-lake-glue-security"

  encryption_configuration {
    cloudwatch_encryption {
      cloudwatch_encryption_mode = "DISABLED"
    }

    job_bookmarks_encryption {
      job_bookmarks_encryption_mode = "DISABLED"
    }

    s3_encryption {
      s3_encryption_mode = "DISABLED"
      # s3_encryption_mode = "SSE-KMS"
      # kms_key_arn        = aws_kms_key.data_lake_key.arn
    }
  }
}

resource "aws_iam_role_policy_attachment" "glue_crawler_policy_attachment" {
  role       = aws_iam_role.glue_crawler_role.name
  policy_arn = aws_iam_policy.glue_crawler_policy.arn
}

### Athena ###

resource "aws_athena_workgroup" "data_lake_workgroup" {
  name = "data-lake-workgroup"

  description = "Workgroup for data lake queries"

  state = "ENABLED"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      # info: https://docs.aws.amazon.com/athena/latest/ug/querying.html
      # for resource "aws_athena_database" "query_results_db"
      # in next TODO comment
      # output_location = aws_s3_bucket.athena_query_results.bucket
      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.data_lake_key.arn
      }
    }
  }

  tags = {
    Environment = "DataLake"
  }
}

### TODO cant currently create a db for the query results, unsure if issue with Localstack or not
### localstack athena API docs:
### https://docs.localstack.cloud/references/coverage/coverage_athena/

# resource "aws_athena_database" "query_results_db" {
#   name          = "athena_query_db"
#   bucket        = aws_s3_bucket.athena_query_results.id
#   force_destroy = true

#   encryption_configuration {
#     encryption_option = "SSE_KMS"
#     kms_key           = aws_kms_key.data_lake_key.arn
#   }
# }

### Workgroup seems to automatically create this
# resource "aws_s3_bucket" "athena_query_results" {
#   bucket = "athena-query-results-${random_string.bucket_suffix.result}"

#   tags = {
#     Purpose = "AthenaQueryResults"
#   }
# }

# resource "aws_athena_data_catalog" "athena_data_catalog" {
#   name        = "athena-glue-data-catalog"
#   description = "Glue based Data Catalog"
#   type        = "GLUE"

#   parameters = {
#     "catalog-id" = "123456789012"
#   }
# }
###END Workgroup seems to automatically create this

resource "aws_iam_policy" "athena_access_policy" {
  name = "athena_access_policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [ # TODO IAM Policy EVAL, wide open for now
          "athena:*",
          "dynamodb:*",
          "glue:*",
          "s3:*",
          # "glue:GetDatabase",
          # "glue:GetDatabases",
          # "glue:GetTable",
          # "glue:GetTables",
          # "s3:GetObject",
          # "s3:ListBucket",
          # "s3:PutObject",
          # "s3:PutObjectAcl"
        ],
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "athena_access_policy_attachment" {
  role       = aws_iam_role.glue_crawler_role.name
  policy_arn = aws_iam_policy.athena_access_policy.arn
}
