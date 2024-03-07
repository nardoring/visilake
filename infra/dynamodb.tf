/*
 * dynamodb.tf
 * AWS DynamoDB Configuration for Analysis and Request Tracking
 *
 * This Terraform configuration establishes two DynamoDB tables to support
 * analysis types and mock request tracking within AWS environment. It
 * is designed to facilitate the storage and retrieval of analysis types and
 * request data efficiently, with predefined read and write capacities.
 *
 * Resources Created:
 * - AWS DynamoDB Table: `analysisTypes` for storing different types of analyses.
 *   - Attributes: `id` (String) as the primary key.
 * - AWS DynamoDB Table: `mockRequests` for tracking mock requests.
 *   - Attributes: `requestID` (String) as the primary key.
 * - DynamoDB Table Items: Pre-populated data for `analysisTypes` and `mockRequests`
 *   from local JSON files, ensuring initial data setup for application use.
 *
 * Design Decisions:
 * - Data Pre-population: Utilizes local JSON files for initial data seeding,
 *   to initialize DynamoDB tables with necessary data for development env
 */

resource "aws_dynamodb_table" "analysisTypes" {
  name           = "analysisTypes"
  read_capacity  = 10
  write_capacity = 5

  attribute {
    name = "id"
    type = "S"
  }

  hash_key = "id"
}

resource "aws_dynamodb_table" "mockRequests" {
  name           = "mockRequests"
  read_capacity  = 10
  write_capacity = 5

  attribute {
    name = "requestID"
    type = "S"
  }
  hash_key = "requestID"
}

# Populate the table with our types
locals {
  mock_types    = jsondecode(file("${path.module}/mockdata/analysisTypes.json"))
  mock_requests = jsondecode(file("${path.module}/mockdata/requests.json"))
}

resource "aws_dynamodb_table_item" "analysisType" {
  for_each   = { for item in local.mock_types : item.id => item }
  table_name = aws_dynamodb_table.analysisTypes.name
  hash_key   = "id"

  item = jsonencode({
    "id"   = { "S" = each.value.id },
    "name" = { "S" = each.value.name }
  })
}

resource "aws_dynamodb_table_item" "mockRequest" {
  for_each   = { for req in local.mock_requests : req.requestID => req }
  table_name = aws_dynamodb_table.mockRequests.name
  hash_key   = "requestID"

  item = jsonencode({
    "requestID"      = { "S" = each.value.requestID },
    "id"             = { "S" = each.value.id },
    "creationDate"   = { "N" = each.value.creationDate },
    "jobStatus"      = { "S" = each.value.jobStatus },
    "jobName"        = { "S" = each.value.jobName },
    "jobDescription" = { "S" = each.value.jobDescription },
    "author"         = { "S" = each.value.author },
    "analysisTypes"  = each.value.analysisTypes,
    "sources"        = each.value.sources,
    "dateRangeStart" = { "N" = each.value.dateRangeStart },
    "dateRangeEnd"   = { "N" = each.value.dateRangeEnd },
    "granularity"    = { "N" = each.value.granularity },
    "powerBILink"    = { "S" = each.value.powerBILink }
  })
}
