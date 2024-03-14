use crate::models::{
    job_request::JobRequest,
    job_type::{deserialize_job_types, serialize_job_types, JobType},
    status::{deserialize_statuses, serialize_statuses, Status},
};
use aws_sdk_dynamodb::types::AttributeValue;
use eyre::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct JobResponse {
    pub response_id: String, // db key
    pub request_id: String,  // points to the originating JobRequest
    pub start_timestamp: i64,
    pub end_timestamp: i64,

    #[serde(
        serialize_with = "serialize_job_types",
        deserialize_with = "deserialize_job_types"
    )]
    pub job_type: Vec<JobType>,

    #[serde(
        serialize_with = "serialize_statuses",
        deserialize_with = "deserialize_statuses"
    )]
    pub job_status: Vec<Status>,
}

pub fn convert_item_to_job_response(item: &HashMap<String, AttributeValue>) -> Result<JobResponse> {
    let job_type_str = item
        .get("jobType")
        .ok_or_else(|| eyre::Error::msg("Missing jobType"))?
        .as_s()
        .map_err(|_| eyre::Error::msg("Invalid jobType"))?;

    let job_type: Vec<JobType> = serde_json::from_str(job_type_str)
        .map_err(|_| eyre::Error::msg("Failed to deserialize jobType"))?;

    let job_status_str = item
        .get("jobStatus")
        .ok_or_else(|| eyre::Error::msg("Missing jobStatus"))?
        .as_s()
        .map_err(|_| eyre::Error::msg("Invalid jobStatus"))?;

    let job_status: Vec<Status> = serde_json::from_str(job_status_str)
        .map_err(|_| eyre::Error::msg("Failed to deserialize jobStatus"))?;

    let response = JobResponse {
        response_id: item
            .get("responseID")
            .ok_or_else(|| eyre::Error::msg("Missing responseID"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid responseID"))?
            .to_owned(),
        request_id: item
            .get("requestID")
            .ok_or_else(|| eyre::Error::msg("Missing requestID"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid requestID"))?
            .to_owned(),
        start_timestamp: item
            .get("startTimestamp")
            .ok_or_else(|| eyre::Error::msg("Missing startTimestamp"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid startTimestamp"))?
            .parse::<i64>()
            .map_err(|_| eyre::Error::msg("Invalid start timestamp format"))?,
        end_timestamp: item
            .get("endTimestamp")
            .ok_or_else(|| eyre::Error::msg("Missing endTimestamp"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid endTimestamp"))?
            .parse::<i64>()
            .map_err(|_| eyre::Error::msg("Invalid end timestamp format"))?,
        job_type,
        job_status,
    };

    Ok(response)
}
