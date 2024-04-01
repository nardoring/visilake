use eyre::Result;
use log::{debug, error};
use std::{path::Path, time::Duration};

use aws_config::SdkConfig;
use aws_sdk_s3::{
    config::Builder,
    error::SdkError,
    operation::{
        copy_object::{CopyObjectError, CopyObjectOutput},
        get_object::{GetObjectError, GetObjectOutput},
        put_object::{PutObjectError, PutObjectOutput},
    },
    presigning::PresigningConfig,
    primitives::ByteStream,
    Client,
};

pub fn s3_client(conf: &SdkConfig) -> Client {
    let s3_config_builder = Builder::from(conf);
    Client::from_conf(s3_config_builder.build())
}

pub async fn list_buckets(client: &Client) -> Result<Vec<String>> {
    let resp = client.list_buckets().send().await?;
    let buckets = resp.buckets();
    let bucket_names: Vec<String> = buckets
        .iter()
        .filter_map(|bucket| bucket.name().map(String::from))
        .collect();

    debug!("Found {} buckets in all regions.", bucket_names.len());

    Ok(bucket_names)
}

pub async fn list_objects(client: &Client, bucket: &str) -> Result<Vec<String>> {
    let mut response = client
        .list_objects_v2()
        .bucket(bucket)
        .max_keys(10)
        .into_paginator()
        .send();

    let mut object_keys = Vec::new();

    while let Some(result) = response.next().await {
        match result {
            Ok(output) => {
                object_keys.extend(
                    output
                        .contents()
                        .iter()
                        .filter_map(|object| object.key().map(String::from)),
                );
            }
            Err(err) => {
                error!("{err:#?}")
            }
        }
    }

    Ok(object_keys)
}

async fn put_object(client: &Client, bucket: &str, object: &str, expires_in: u64) -> Result<()> {
    let expires_in = Duration::from_secs(expires_in);

    let presigned_request = client
        .put_object()
        .bucket(bucket)
        .key(object)
        .presigned(PresigningConfig::expires_in(expires_in)?)
        .await?;

    debug!("Object URI: {}", presigned_request.uri());

    Ok(())
}

async fn get_object(client: &Client, bucket: &str, object: &str, expires_in: u64) -> Result<()> {
    let expires_in = Duration::from_secs(expires_in);
    let presigned_request = client
        .get_object()
        .bucket(bucket)
        .key(object)
        .presigned(PresigningConfig::expires_in(expires_in)?)
        .await?;

    debug!("Object URI: {}", presigned_request.uri());

    Ok(())
}

pub async fn copy_object(
    client: &Client,
    bucket_name: &str,
    object_key: &str,
    target_key: &str,
) -> Result<CopyObjectOutput, SdkError<CopyObjectError>> {
    let mut source_bucket_and_object: String = "".to_owned();
    source_bucket_and_object.push_str(bucket_name);
    source_bucket_and_object.push('/');
    source_bucket_and_object.push_str(object_key);

    client
        .copy_object()
        .copy_source(source_bucket_and_object)
        .bucket(bucket_name)
        .key(target_key)
        .send()
        .await
}

pub async fn download_object(
    client: &Client,
    bucket_name: &str,
    key: &str,
) -> Result<GetObjectOutput, SdkError<GetObjectError>> {
    client
        .get_object()
        .bucket(bucket_name)
        .key(key)
        .send()
        .await
}

pub async fn upload_object(client: &Client, bucket: &str, filename: &str, key: &str) -> Result<()> {
    let resp = client.list_buckets().send().await?;

    for bucket in resp.buckets() {
        println!("bucket: {:#?}", bucket.name().unwrap_or_default())
    }

    println!();

    let body = ByteStream::from_path(Path::new(filename)).await;

    match body {
        Ok(b) => {
            let resp = client
                .put_object()
                .bucket(bucket)
                .key(key)
                .body(b)
                .send()
                .await?;

            println!("Upload success. Version: {:#?}", resp.version_id);

            let resp = client.get_object().bucket(bucket).key(key).send().await?;
            let data = resp.body.collect().await;
            println!("data: {:#?}", data.unwrap().into_bytes());
        }
        Err(err) => {
            error!("{err:#?}")
        }
    }

    Ok(())
}
