use crate::models::{
    job_request::JobRequest,
    job_response::JobResponse,
    job_type::{deserialize_job_types, serialize_job_types, JobType},
    status::{deserialize_statuses, serialize_statuses, Status},
};
use aws_sdk_dynamodb::types::AttributeValue;
use eyre::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub job_id: String,              // db key
    pub request_id: String,          // points to the originating JobRequest
    pub current_response_id: String, // points to the latest JobResponse
    pub last_updated: i64,           // timestamp
    pub input_path: String,          // s3 path
    pub output_path: String,         // s3 path
}

pub fn convert_item_to_job(item: &HashMap<String, AttributeValue>) -> Result<Job> {
    let job = Job {
        job_id: item
            .get("jobID")
            .ok_or_else(|| eyre::Error::msg("Missing job id"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid job id"))?
            .to_owned(),
        request_id: item
            .get("requestID")
            .ok_or_else(|| eyre::Error::msg("Missing requestID"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid requestID"))?
            .to_owned(),
        current_response_id: item
            .get("responseID")
            .ok_or_else(|| eyre::Error::msg("Missing requestID"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid requestID"))?
            .to_owned(),
        last_updated: item
            .get("lastUpdated")
            .ok_or_else(|| eyre::Error::msg("Missing lastUpdated"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid lastUpdated"))?
            .parse::<i64>()
            .map_err(|_| eyre::Error::msg("Invalid timestamp format"))?,
        input_path: item
            .get("inputPath")
            .ok_or_else(|| eyre::Error::msg("Missing inputPath"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid inputPath"))?
            .to_owned(),
        output_path: item
            .get("responseID")
            .ok_or_else(|| eyre::Error::msg("Missing outputPath"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid outputPath"))?
            .to_owned(),
    };

    Ok(job)
}
