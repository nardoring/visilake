use crate::{
    aws::sns::publish, models::job_request::convert_item_to_job_request, models::status::Status,
};
use aws_sdk_dynamodb::{
    error::SdkError, operation::update_item::UpdateItemError, types::AttributeValue,
    Client as DynamoDbClient,
};
use aws_sdk_sns::Client as SnsClient;
use eyre::{Report, Result};
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
    current_status: Status,
) -> Result<HashMap<String, AttributeValue>> {
    if let Some(new_status) = current_status.next() {
        let new_status_str = new_status.to_string();
        let mut updated_item = item.clone();
        updated_item.insert(
            "jobStatus".to_string(),
            AttributeValue::S(new_status_str.clone()),
        );

        let update_request_builder = dynamodb_client
            .update_item()
            .table_name(TABLE)
            .key("requestID".to_string(), item["requestID"].clone())
            .key("creationDate", item["creationDate"].clone())
            .update_expression("SET #st = :status_val")
            .expression_attribute_names("#st", "jobStatus")
            .expression_attribute_values(":status_val", AttributeValue::S(new_status_str));

        update_request_builder.send().await?;
        Ok(updated_item)
    } else {
        Err(Report::msg("No next status available"))
    }
}

pub async fn process_jobs(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topics: &Vec<String>,
    job_status: &str,
) -> Result<()> {
    let items = scan_for(dynamodb_client, TABLE, "jobStatus", job_status).await?;

    for item in items {
        debug!("Item to update {:#?}", item);

        let job_request = convert_item_to_job_request(&item)?;
        let updated_item =
            update_request_status(dynamodb_client, &item, job_request.status).await?;

        let job_request = convert_item_to_job_request(&updated_item)?;

        debug!("Updated item: {:#?}", job_request);

        let json_string = serde_json::to_string(&job_request)?;

        for topic in topics.iter() {
            publish(sns_client, topic, &json_string).await?;
            debug!("Published to: {:#?}", topic);
        }
    }

    Ok(())
}

pub async fn queue_new_requests(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topics: &Vec<String>,
) -> Result<()> {
    process_jobs(dynamodb_client, sns_client, topics, "PENDING").await
}

pub async fn process_queued_jobs(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topics: &Vec<String>,
) -> Result<()> {
    process_jobs(dynamodb_client, sns_client, topics, "QUEUED").await
}

pub async fn complete_processed_jobs(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topics: &Vec<String>,
) -> Result<()> {
    process_jobs(dynamodb_client, sns_client, topics, "PROCESSING").await
}
