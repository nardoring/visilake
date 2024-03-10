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
    pub request: JobRequest,
    pub response_id: String, // db key
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
