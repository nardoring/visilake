use aws_config::SdkConfig;
use aws_sdk_sns::{config::Builder, types::Topic, Client};
use eyre::{Error, Result};
use log::debug;

use crate::list_queues;

pub fn sns_client(conf: &SdkConfig) -> Client {
    let sns_config_builder = Builder::from(conf);
    Client::from_conf(sns_config_builder.build())
}

pub async fn list_topics(client: &Client) -> Result<Vec<String>, Error> {
    let resp = client.list_topics().send().await?;

    let topic_arns: Vec<String> = resp
        .topics()
        .iter()
        .filter_map(|topic: &Topic| topic.topic_arn().map(String::from))
        .collect();
    debug!("Topics: {:?}", topic_arns);

    Ok(topic_arns)
}

pub async fn subscribe(client: &Client, topic_arn: &str, queue_arn: &str) -> Result<(), Error> {
    debug!(
        "Subscribing {} on topic with ARN: `{}`",
        queue_arn, topic_arn
    );

    let rsp = client
        .subscribe()
        .topic_arn(topic_arn)
        .protocol("sqs")
        .endpoint(queue_arn)
        .send()
        .await?;

    debug!(
        "Added a subscription: {:?} on endpoint {:?}",
        rsp, queue_arn
    );

    Ok(())
}

pub async fn publish(client: &Client, topic_arn: &str, message: &str) -> Result<(), Error> {
    debug!("Receiving on topic with ARN: `{}`", topic_arn);

    let rsp = client
        .publish()
        .topic_arn(topic_arn)
        .message(message)
        .message_group_id("updates")
        .send()
        .await?;

    debug!("Published message: {:?}", rsp);

    Ok(())
}

pub async fn setup_topic(client: &Client) -> Result<()> {
    let topic_arn = "arn:aws:sns:us-east-1:000000000000:requestUpdatesTopic.fifo".to_string();

    let queue_arns = [
        "arn:aws:sqs:us-east-1:000000000000:requestUpdatesQueue-1",
        "arn:aws:sqs:us-east-1:000000000000:requestUpdatesQueue-2",
        "arn:aws:sqs:us-east-1:000000000000:requestUpdatesQueue-3",
        "arn:aws:sqs:us-east-1:000000000000:requestUpdatesQueue-4",
        "arn:aws:sqs:us-east-1:000000000000:requestUpdatesQueue-5",
    ];

    for queue in queue_arns {
        subscribe(client, &topic_arn, &queue).await?;
    }

    Ok(())
}
