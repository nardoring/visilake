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

