use crate::{aws::sns::publish, models::job_request::convert_item_to_job_request};
use aws_sdk_dynamodb::{
    error::SdkError, operation::update_item::UpdateItemError, types::AttributeValue,
    Client as DynamoDbClient,
};
use aws_sdk_sns::Client as SnsClient;
use eyre::Result;
use log::debug;
use std::collections::HashMap;

const TABLE: &str = "mockRequests";

async fn scan_for(
    dynamodb_client: &DynamoDbClient,
    table: &str,
    attr_name: &str,
    attr_val: &str,
) -> Result<Vec<HashMap<String, AttributeValue>>> {
    let result = dynamodb_client
        .scan()
        .table_name(table)
        .filter_expression("#st = :val")
        .expression_attribute_names("#st", attr_name)
        .expression_attribute_values(":val", AttributeValue::S(attr_val.to_string()))
        .send()
        .await?;

    Ok(result.items().to_vec())
}

async fn update_request_status(
    dynamodb_client: &DynamoDbClient,
    item: &HashMap<String, AttributeValue>,
    new_status: &str,
) -> Result<HashMap<String, AttributeValue>, SdkError<UpdateItemError>> {
    let mut updated_item = item.clone();
    updated_item.insert(
        "jobStatus".to_string(),
        AttributeValue::S(new_status.to_string()),
    );

    let update_request_builder = dynamodb_client
        .update_item()
        .table_name("mockRequests")
        .key("requestID".to_string(), item["requestID"].clone())
        .update_expression("SET #st = :status_val")
        .expression_attribute_names("#st", "jobStatus")
        .expression_attribute_values(":status_val", AttributeValue::S(new_status.to_string()));

    update_request_builder.send().await?;
    Ok(updated_item)
}

pub async fn process_queued_requests(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topic_arn: &str,
) -> Result<()> {
    let items = scan_for(dynamodb_client, TABLE, "jobStatus", "QUEUED").await?;

    for item in items {
        debug!("Item to update {:#?}", item);

        let updated_item = update_request_status(dynamodb_client, &item, "PROCESSING").await?;
        let job_request = convert_item_to_job_request(&updated_item)?;

        debug!("Updated item: {:#?}", job_request);

        let json_string = serde_json::to_string(&job_request)?;
        publish(sns_client, topic_arn, &json_string).await?;
    }

    Ok(())
}
