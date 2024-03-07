use aws_config::{defaults, BehaviorVersion, SdkConfig};
use eyre::Result;
use utils::use_localstack;

use crate::utils;

const LOCALSTACK_ENDPOINT: &str = "http://localhost:4566/";

pub async fn configure() -> Result<SdkConfig> {
    let mut shared_config = defaults(BehaviorVersion::latest());
    if use_localstack() {
        shared_config = shared_config.endpoint_url(LOCALSTACK_ENDPOINT);
    };
    let shared_config = shared_config.load().await;

    Ok(shared_config)
}
