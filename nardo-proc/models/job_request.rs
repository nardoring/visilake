use aws_sdk_dynamodb::Client;
use eyre::Result;
use log::debug;
use std::fmt;

use aws_sdk_dynamodb::types::AttributeValue;
use std::collections::HashMap;

#[derive(Debug)]
pub struct JobRequest {
    pub id: String,
    pub request_id: String, // db key
    pub author: String,
    pub name: String,
    pub description: String,
    pub analysis_types: Vec<String>,
    pub timestamp: i64,
    pub status: String,
    pub sources: Vec<String>,
}

impl fmt::Display for JobRequest {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "\nrequestID: {} \nID: {} \nName: {} \nDescription: {} \nStatus: {} \nTimestamp: {} \nAnalysis Type(s): {:?} \nSource(s): {:?}",
            self.request_id, self.id, self.name, self.description, self.status, self.timestamp, self.analysis_types, self. sources
        )
    }
}

pub async fn list_requests(client: &Client) -> Result<()> {
    let result = client.scan().table_name("mockRequests").send().await?;

    for item in result.items() {
        let request = JobRequest {
            id: item["id"].as_s().unwrap().clone(),
            request_id: item["requestID"].as_s().unwrap().clone(),
            name: item["jobName"].as_s().unwrap().clone(),
            author: item["author"].as_s().unwrap().clone(),
            description: item["jobDescription"].as_s().unwrap().clone(),
            analysis_types: item["analysisTypes"]
                .as_l()
                .unwrap()
                .iter()
                .map(|v| v.as_s().unwrap().clone())
                .collect(),
            timestamp: item["creationDate"].as_n().unwrap().parse::<i64>().unwrap(),
            status: item["jobStatus"].as_s().unwrap().clone(),
            sources: item["sources"]
                .as_l()
                .unwrap()
                .iter()
                .map(|v| v.as_s().unwrap().clone())
                .collect(),
        };

        debug!("Request: {:?}", request);
    }

    Ok(())
}
