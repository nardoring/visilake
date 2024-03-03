#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

mod aws;
mod config;
mod models;
mod utils;

pub(crate) use crate::{
    aws::dynamodb::{dynamodb_client, list_items, list_tables},
    utils::init_logging,
};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    init_logging();

    let shared_config = config::configure().await?;
    let dynamodb_client = dynamodb_client(&shared_config);
    let tables = list_tables(&dynamodb_client).await?;
    let items = list_items(&dynamodb_client, &tables[1], Some(1)).await?;

    Ok(())
}
