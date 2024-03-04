use crate::models::job_request::JobRequest;

use aws_config::SdkConfig;
use aws_sdk_dynamodb::{
    config::Builder,
    error::SdkError,
    operation::{delete_item::DeleteItemOutput, put_item::PutItemError},
    types::AttributeValue,
    Client, Error,
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

async fn add_item(
    client: &Client,
    request: JobRequest,
    table: &str,
) -> Result<(), SdkError<PutItemError>> {
    let id = AttributeValue::S(request.id);
    let request_id = AttributeValue::S(request.request_id);
    let author = AttributeValue::S(request.author);
    let name = AttributeValue::S(request.name);
    let desc = AttributeValue::S(request.description);
    let timestamp = AttributeValue::S(request.timestamp.to_string());
    // TODO map these
    // let analysis_types = AttributeValue::S(request.analysis_types);
    // let sources = AttributeValue::S(request.sources);
    let status = AttributeValue::S(request.status);

    match client
        .put_item()
        .table_name(table)
        .item("id", id)
        .item("request_id", request_id)
        .item("author", author)
        .item("jobName", name)
        .item("jobDescription", desc)
        // .item("analysisTypes", analysis_types)
        .item("creationDate", timestamp)
        .item("jobStatus", status)
        // .item("sources", sources)
        .send()
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
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
            println!("Deleted item from table");
            Ok(out)
        }
        Err(e) => Err(e.into()),
    }
}
