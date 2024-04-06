use crate::models::status::{deserialize_status, serialize_status, Status};
use aws_sdk_dynamodb::types::AttributeValue;
use eyre::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct JobRequest {
    pub id: String,
    pub request_id: String, // db key
    pub author: String,
    pub name: String,
    pub description: String,
    pub analysis_types: Vec<String>,
    pub timestamp: i64,
    #[serde(
        serialize_with = "serialize_status",
        deserialize_with = "deserialize_status"
    )]
    pub status: Status,
    pub sources: Vec<String>,
    pub range_start: i64,
    pub range_end: i64,
    pub granularity: i32,
}

pub fn convert_item_to_job_request(item: &HashMap<String, AttributeValue>) -> Result<JobRequest> {
    let job_request = JobRequest {
        id: item
            .get("id")
            .ok_or_else(|| eyre::Error::msg("Missing id"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid id"))?
            .to_owned(),
        request_id: item
            .get("requestID")
            .ok_or_else(|| eyre::Error::msg("Missing requestID"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid requestID"))?
            .to_owned(),
        name: item
            .get("jobName")
            .ok_or_else(|| eyre::Error::msg("Missing jobName"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid jobName"))?
            .to_owned(),
        author: item
            .get("author")
            .ok_or_else(|| eyre::Error::msg("Missing author"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid author"))?
            .to_owned(),
        description: item
            .get("jobDescription")
            .ok_or_else(|| eyre::Error::msg("Missing jobDescription"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid jobDescription"))?
            .to_owned(),
        analysis_types: item
            .get("analysisTypes")
            .ok_or_else(|| eyre::Error::msg("Missing analysisTypes"))?
            .as_l()
            .map_err(|_| eyre::Error::msg("Invalid analysisTypes"))?
            .iter()
            .map(|v| v.as_s().unwrap().to_owned())
            .collect(),
        timestamp: item
            .get("creationDate")
            .ok_or_else(|| eyre::Error::msg("Missing creationDate"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid creationDate"))?
            .parse::<i64>()
            .map_err(|_| eyre::Error::msg("Invalid timestamp format"))?,
        status: item
            .get("jobStatus")
            .ok_or_else(|| eyre::Error::msg("Missing jobStatus"))?
            .as_s()
            .map_err(|_| eyre::Error::msg("Invalid jobStatus"))?
            .parse::<Status>()
            .map_err(|_| eyre::Error::msg("Failed to parse jobStatus into a Status enum"))?,
        sources: item
            .get("sources")
            .ok_or_else(|| eyre::Error::msg("Missing sources"))?
            .as_l()
            .map_err(|_| eyre::Error::msg("Invalid sources"))?
            .iter()
            .map(|v| v.as_s().unwrap().to_owned())
            .collect(),
        range_start: item
            .get("dateRangeStart")
            .ok_or_else(|| eyre::Error::msg("Missing rangeStart"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid rangeStart"))?
            .parse::<i64>()
            .map_err(|_| eyre::Error::msg("Invalid timestamp format"))?,
        range_end: item
            .get("dateRangeEnd")
            .ok_or_else(|| eyre::Error::msg("Missing rangeEnd"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid rangeEnd"))?
            .parse::<i64>()
            .map_err(|_| eyre::Error::msg("Invalid timestamp format"))?,
        granularity: item
            .get("granularity")
            .ok_or_else(|| eyre::Error::msg("Missing granularity"))?
            .as_n()
            .map_err(|_| eyre::Error::msg("Invalid granularity"))?
            .parse::<i32>()
            .map_err(|_| eyre::Error::msg("Invalid granularity format"))?,
    };

    Ok(job_request)
}
