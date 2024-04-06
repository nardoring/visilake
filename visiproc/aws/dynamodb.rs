#![allow(dead_code)]
use aws_config::SdkConfig;
use aws_sdk_dynamodb::{
    config::Builder, operation::delete_item::DeleteItemOutput, types::AttributeValue, Client, Error,
};
use eyre::Result;
use log::debug;

pub fn dynamodb_client(conf: &SdkConfig) -> Client {
    let dynamodb_config_builder = Builder::from(conf);
    Client::from_conf(dynamodb_config_builder.build())
}

async fn list_tables(client: &Client) -> Result<Vec<String>, Error> {
    let paginator = client.list_tables().into_paginator().items().send();
    let table_names = paginator.collect::<Result<Vec<_>, _>>().await?;

    for name in &table_names {
        debug!("Table:  {}", name);
    }

    Ok(table_names)
}

async fn list_items(client: &Client, table: &str, page_size: Option<i32>) -> Result<()> {
    let page_size = page_size.unwrap_or(10);
    let items: Result<Vec<_>, _> = client
        .scan()
        .table_name(table)
        .limit(page_size)
        .into_paginator()
        .items()
        .send()
        .collect()
        .await;

    for item in items? {
        debug!("\n{} - {:?}", table, item);
    }

    Ok(())
}

pub async fn delete_item(
    client: &Client,
    table: &str,
    key: &str,
    value: &str,
) -> Result<DeleteItemOutput> {
    match client
        .delete_item()
        .table_name(table)
        .key(key, AttributeValue::S(value.into()))
        .send()
        .await
    {
        Ok(out) => {
            debug!("Deleted item from table");
            Ok(out)
        }
        Err(e) => Err(e.into()),
    }
}
