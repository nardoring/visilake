use aws_config::{BehaviorVersion, SdkConfig};
use std::error::Error;
use utils::use_localstack;

use crate::utils;

const LOCALSTACK_ENDPOINT: &str = "http://localhost:4566/";

pub async fn configure() -> Result<SdkConfig, Box<dyn Error>> {
    let mut shared_config = aws_config::defaults(BehaviorVersion::latest());
    if use_localstack() {
        shared_config = shared_config.endpoint_url(LOCALSTACK_ENDPOINT);
    };
    let shared_config = shared_config.load().await;

    Ok(shared_config)
}
