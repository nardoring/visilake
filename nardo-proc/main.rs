#![feature(inherent_associated_types)]
#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
mod aws;
mod config;
mod models;
mod tasks;
mod utils;

pub(crate) use crate::{
    aws::dynamodb::dynamodb_client,
    aws::sns::{list_topics, setup_topic, sns_client},
    aws::sqs::{get_message, list_queues, send_message, sqs_client},
    utils::init_logging,
};
use eyre::Result;
use tasks::process::process_queued_requests;

#[tokio::main]
async fn main() -> Result<()> {
    let _init_logging = init_logging()?;

    let shared_config = config::configure().await?;
    let dynamodb_client = dynamodb_client(&shared_config);
    let sns_client = sns_client(&shared_config);
    let sqs_client = sqs_client(&shared_config);

    setup_topic(&sns_client).await?;
    let topics = list_topics(&sns_client).await?;
    let queues = list_queues(&sqs_client).await?;

    process_queued_requests(&dynamodb_client, &sns_client, &topics).await?;

    for queue in queues {
        get_message(&sqs_client, &queue).await?;
    }

    Ok(())
}
