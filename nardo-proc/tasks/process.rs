use crate::aws::sns::publish;
use crate::models::job_request::{self, convert_item_to_job_request};
use crate::sns_client;
use aws_sdk_dynamodb::types::AttributeValue;
use eyre::Result;
use log::debug;
use serde_json;
use std::collections::HashMap;

pub async fn process_queued_requests(
    dynamodb_client: &aws_sdk_dynamodb::Client,
    sns_client: &aws_sdk_sns::Client,
    topic_arn: &str,
) -> Result<()> {
    // Scan for QUEUED items with a FilterExpression
    let result = dynamodb_client
        .scan()
        .table_name("mockRequests")
        .filter_expression("#st = :status_val")
        .expression_attribute_names("#st", "jobStatus")
        .expression_attribute_values(":status_val", AttributeValue::S("QUEUED".to_string()))
        .send()
        .await?;

    let items = result.items();
    debug!("Items to update {:#?}", items);

    // Update each QUEUED item to PROCESSING
    for item in items {
        let mut updated_item = item.clone();
        updated_item.insert(
            "status".to_string(),
            AttributeValue::S("PROCESSING".to_string()),
        );

        let mut update_request_builder = dynamodb_client.update_item().table_name("mockRequests");
        update_request_builder =
            update_request_builder.key("requestID".to_string(), updated_item["requestID"].clone());
        update_request_builder = update_request_builder.update_expression("SET #st = :status_val");
        update_request_builder =
            update_request_builder.expression_attribute_names("#st", "jobStatus");
        update_request_builder = update_request_builder.expression_attribute_values(
            ":status_val",
            AttributeValue::S("PROCESSING".to_string()),
        );
        update_request_builder.send().await?;

        // Convert the DynamoDB item to a JobRequest instance
        let job_request = convert_item_to_job_request(&updated_item)?;
        debug!("Updated item: {}", job_request);
        let json_string = serde_json::to_string(&job_request)?;
        publish(sns_client, topic_arn, &json_string).await?;
    }

    Ok(())
}
