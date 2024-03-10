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
 * - AWS DynamoDB Table: `sourceTags` for storing source tags.
 *   - Attributes: `sourceTag` (String) as the primary key, since there shouldn't be any duplicate tags.
 * - AWS DynamoDB Table: `mockRequests` for tracking mock requests.
 *   - Attributes: `requestID` (String) as the primary key.
 * - DynamoDB Table Items: Pre-populated data for `analysisTypes`, `sources`, and `mockRequests`
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

resource "aws_dynamodb_table" "sourceTags" {
  name           = "sourceTags"
  read_capacity  = 10
  write_capacity = 5

  attribute {
    name = "sourceTag"
    type = "S"
  }

  hash_key = "sourceTag"
}

resource "aws_dynamodb_table" "mockRequests" {
  name         = "mockRequests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "requestID"
  range_key    = "creationDate"

  attribute {
    name = "requestID"
    type = "S"
  }

  attribute {
    name = "creationDate"
    type = "N"
  }
}

resource "aws_dynamodb_table" "jobs" {
  name         = "Jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "jobID"

  attribute {
    name = "jobID"
    type = "S"
  }

  attribute {
    name = "requestID"
    type = "S"
  }

  global_secondary_index {
    name            = "RequestIDIndex"
    hash_key        = "requestID"
    projection_type = "KEYS_ONLY"
  }
}

resource "aws_dynamodb_table" "mockResponses" {
  name         = "JobResponses"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "responseID"
  range_key    = "start_timestamp"

  attribute {
    name = "responseID"
    type = "S"
  }

  attribute {
    name = "requestID"
    type = "S"
  }

  attribute {
    name = "start_timestamp"
    type = "N"
  }

  global_secondary_index {
    name               = "RequestIDIndex"
    hash_key           = "requestID"
    projection_type    = "INCLUDE"
    non_key_attributes = ["start_timestamp", "end_timestamp"]
  }
}

# Populate the table with our types
locals {
  mock_types    = jsondecode(file("${path.module}/mockdata/analysisTypes.json"))
  mock_requests = jsondecode(file("${path.module}/mockdata/requests.json"))
  mock_sourceTags  = jsondecode(file("${path.module}/mockdata/sourceTags.json"))
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

resource "aws_dynamodb_table_item" "sourceTags" {
  for_each   = { for item in local.mock_sourceTags : item.sourceTag => item }
  table_name = aws_dynamodb_table.sourceTags.name
  hash_key   = "sourceTag"

  item = jsonencode({
    "sourceTag" = { "S" = each.value.sourceTag }
  })
}

resource "aws_dynamodb_table_item" "mockRequest" {
  for_each   = { for req in local.mock_requests : req.requestID => req }
  table_name = aws_dynamodb_table.mockRequests.name
  hash_key   = aws_dynamodb_table.mockRequests.hash_key
  range_key  = aws_dynamodb_table.mockRequests.range_key

  item = jsonencode({
    "requestID"      = { "S" = each.value.requestID },
    "id"             = { "S" = tostring(each.value.id) },
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
