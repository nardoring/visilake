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

async fn list_buckets(strict: bool, client: &Client, region: &str) -> Result<()> {
    let resp = client.list_buckets().send().await?;
    let buckets = resp.buckets();
    let num_buckets = buckets.len();

    let mut in_region = 0;

    for bucket in buckets {
        if strict {
            let r = client
                .get_bucket_location()
                .bucket(bucket.name().unwrap_or_default())
                .send()
                .await?;

            if r.location_constraint().unwrap().as_ref() == region {
                debug!("{}", bucket.name().unwrap_or_default());
                in_region += 1;
            }
        } else {
            debug!("{}", bucket.name().unwrap_or_default());
        }
    }

    if strict {
        debug!(
            "Found {} buckets in the {} region out of a total of {} buckets.",
            in_region, region, num_buckets
        );
    } else {
        debug!("Found {} buckets in all regions.", num_buckets);
    }

    Ok(())
}

pub async fn list_objects(client: &Client, bucket: &str) -> Result<()> {
    let mut response = client
        .list_objects_v2()
        .bucket(bucket.to_owned())
        .max_keys(10) // In this example, go 10 at a time.
        .into_paginator()
        .send();

    while let Some(result) = response.next().await {
        match result {
            Ok(output) => {
                for object in output.contents() {
                    debug!(" - {}", object.key().unwrap_or("Unknown"));
                }
            }
            Err(err) => {
                error!("{err:?}")
            }
        }
    }

    Ok(())
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

pub async fn upload_object(
    client: &Client,
    bucket_name: &str,
    file_name: &str,
    key: &str,
) -> Result<PutObjectOutput, SdkError<PutObjectError>> {
    let body = ByteStream::from_path(Path::new(file_name)).await;
    client
        .put_object()
        .bucket(bucket_name)
        .key(key)
        .body(body.unwrap())
        .send()
        .await
}
