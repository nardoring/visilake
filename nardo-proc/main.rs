#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

mod aws;
mod config;
mod models;
mod utils;

pub(crate) use crate::{
    aws::dynamodb::dynamodb_client,
    aws::sns::{sns_client, test_topic},
    aws::sqs::{get_message, send_message, sqs_client},
    utils::init_logging,
};
use eyre::Result;

#[tokio::main]
async fn main() -> Result<()> {
    let _init_logging = init_logging()?;

    let shared_config = config::configure().await?;
    let _dynamodb_client = dynamodb_client(&shared_config);
    // let sqs_client = sqs_client(&shared_config);
    let sns_client = sns_client(&shared_config);

    // let tables = list_tables(&dynamodb_client).await?;
    // let items = list_items(&dynamodb_client, &tables[1], Some(1)).await?;

    // send_message(&sqs_client, &"TEST".to_string()).await?;
    // get_message(&sqs_client).await?;
    test_topic(&sns_client).await?;

    Ok(())
}
