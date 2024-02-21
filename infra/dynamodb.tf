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
    "requestID"          = { "S" = each.value.requestID },
    "id"                 = { "S" = each.value.id },
    "creationDate"       = { "N" = each.value.creationDate },
    "useCaseStatus"      = { "S" = each.value.useCaseStatus },
    "useCaseName"        = { "S" = each.value.useCaseName },
    "useCaseDescription" = { "S" = each.value.useCaseDescription },
    "author"             = { "S" = each.value.author },
    "analysisTypes"      = each.value.analysisTypes,
    "powerBILink"        = { "S" = each.value.powerBILink }
  })
}
