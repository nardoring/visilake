#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

mod aws;
mod config;
mod models;
mod tasks;
mod utils;

pub(crate) use crate::{
    aws::dynamodb::dynamodb_client,
    aws::sns::{list_topics, sns_client, test_topic},
    aws::sqs::{get_message, send_message, sqs_client},
    utils::init_logging,
};
use eyre::Result;
use models::job_request::list_requests;
use tasks::process::process_queued_requests;

#[tokio::main]
async fn main() -> Result<()> {
    let _init_logging = init_logging()?;

    let shared_config = config::configure().await?;
    let dynamodb_client = dynamodb_client(&shared_config);
    let sns_client = sns_client(&shared_config);

    let topic = list_topics(&sns_client).await?;

    process_queued_requests(&dynamodb_client, &sns_client, &topic[0]).await?;

    Ok(())
}
