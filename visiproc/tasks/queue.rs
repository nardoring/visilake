use crate::{
    analysis::analysis_jobs::create_job_instance,
    aws::sns::publish,
    models::{
        job::create_job_from_request,
        job_queue::JobQueue,
        job_request::{convert_item_to_job_request, JobRequest},
        job_type::JobType,
        status::Status,
    },
};
use aws_sdk_dynamodb::{types::AttributeValue, Client as DynamoDbClient};
use aws_sdk_sns::Client as SnsClient;
use eyre::{Report, Result};
use log::debug;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

pub async fn scan_for(
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

pub async fn update_request_status(
    dynamodb_client: &DynamoDbClient,
    item: &HashMap<String, AttributeValue>,
    current_status: &Status,
    table: &str,
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
            .table_name(table)
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

pub fn queue_jobs_from_request(job_request: &JobRequest, job_queue: &mut JobQueue) -> Result<()> {
    let job_metadata = Arc::new(Mutex::new(create_job_from_request(job_request)));
    let analysis_types = JobType::from_request(job_request);

    for job_type in analysis_types {
        let job_clone = job_metadata.clone();
        {
            let mut job = job_clone.lock().unwrap();
            if let Some(new_status) = job.status.next() {
                job.status = new_status;
            }
        } // Lock is dropped here

        let job_impl = create_job_instance(job_type);
        job_queue.add_job(job_impl, job_clone);
    }

    Ok(())
}

pub async fn queue_new_requests(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topics: &Vec<String>,
    job_queue: &mut JobQueue,
) -> Result<()> {
    for item in scan_for(dynamodb_client, "mockRequests", "jobStatus", "PENDING").await? {
        let job_request = convert_item_to_job_request(&item)?;

        // queue the job
        queue_jobs_from_request(&job_request, job_queue)?;

        let updated_item =
            update_request_status(dynamodb_client, &item, &job_request.status, "mockRequests")
                .await?;
        let job_request = convert_item_to_job_request(&updated_item)?;

        // publish message about the queued job
        let json_string = serde_json::to_string(&job_request)?;
        for topic in topics.iter() {
            publish(sns_client, topic, &json_string).await?;
        }
        debug!("Published queued job {:#?}", updated_item);
    }

    Ok(())
}

pub async fn publish_complete_requests(
    dynamodb_client: &DynamoDbClient,
    sns_client: &SnsClient,
    topics: &Vec<String>,
    job_queue: &mut JobQueue,
) -> Result<()> {
    for job_arc in job_queue.iter() {
        let job = job_arc.lock().unwrap();

        if job.status == Status::Completed {
            debug!("Job Info: {:?}", *job_arc);
            for item in scan_for(
                dynamodb_client,
                "mockRequests",
                "requestID",
                &job.request_id,
            )
            .await?
            {
                let updated_item = update_request_status(
                    dynamodb_client,
                    &item,
                    &Status::Processing,
                    "mockRequests",
                )
                .await?;
                let job_request = convert_item_to_job_request(&updated_item)?;

                let json_string = serde_json::to_string(&job_request)?;
                for topic in topics.iter() {
                    publish(sns_client, topic, &json_string).await?;
                }
            }
        } else {
            debug!("Job Info (Not Complete): {:?}", *job);
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    pub fn generate_request_id() -> String {
        Uuid::new_v4()
            .simple()
            .to_string()
            .chars()
            .take(8)
            .collect::<String>()
    }

    #[tokio::test]
    async fn test_simulated_job_run() -> Result<()> {
        let mut job_queue = JobQueue::new();

        // empty queue
        println!("{:#}", job_queue);

        let job_request = JobRequest {
            analysis_types: vec![
                "Simulated Job".to_string(),
                // "Exploratory Data Analysis".to_string(),
                // "Simulated Error".to_string(),
            ],
            id: generate_request_id(),
            request_id: generate_request_id(),
            author: "test author".to_string(),
            name: "test job".to_string(),
            description: "test desc".to_string(),
            timestamp: 0,
            status: Status::Pending,
            sources: vec!["simulated".to_string()],
            range_start: 0,
            range_end: 1,
            granularity: 0,
        };

        queue_jobs_from_request(&job_request, &mut job_queue)?;
        println!("{:#}", job_queue);

        // run jobs
        job_queue.run().await?;
        println!("{:#}", job_queue);

        Ok(())
    }
}
