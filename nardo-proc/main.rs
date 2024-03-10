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
    aws::sns::{list_topics, sns_client},
    aws::sqs::{get_message, list_queues, sqs_client},
    models::data::test_csv_to_parquet,
    utils::init_logging,
};
use eyre::Result;
use tasks::queue::queue_new_requests;

#[tokio::main]
async fn main() -> Result<()> {
    let _init_logging = init_logging()?;

    test_csv_to_parquet();

    let shared_config = config::configure().await?;
    let dynamodb_client = dynamodb_client(&shared_config);
    let sns_client = sns_client(&shared_config);
    let sqs_client = sqs_client(&shared_config);

    let topics = list_topics(&sns_client).await?;
    let queues = list_queues(&sqs_client).await?;

    queue_new_requests(&dynamodb_client, &sns_client, &topics).await?;

    for queue in queues {
        get_message(&sqs_client, &queue).await?;
    }

    Ok(())
}
