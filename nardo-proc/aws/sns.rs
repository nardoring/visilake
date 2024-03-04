use aws_config::SdkConfig;
use aws_sdk_sns::{config::Builder, types::Topic, Client};
use eyre::{Error, Result};
use log::debug;

pub fn sns_client(conf: &SdkConfig) -> Client {
    let sns_config_builder = Builder::from(conf);
    Client::from_conf(sns_config_builder.build())
}

async fn list_topics(client: &Client) -> Result<Vec<String>, Error> {
    let resp = client.list_topics().send().await?;

    let topic_arns: Vec<String> = resp
        .topics()
        .iter()
        .filter_map(|topic: &Topic| topic.topic_arn().map(String::from))
        .collect();
    debug!("Topics: {:?}", topic_arns);

    Ok(topic_arns)
}

async fn subscribe(client: &Client, topic_arn: &str, queue_arn: &str) -> Result<(), Error> {
    debug!("Receiving on topic with ARN: `{}`", topic_arn);

    let rsp = client
        .subscribe()
        .topic_arn(topic_arn)
        .protocol("sqs")
        .endpoint(queue_arn)
        .send()
        .await?;

    debug!("Added a subscription: {:?}", rsp);

    Ok(())
}

async fn publish(client: &Client, topic_arn: &str, message: &str) -> Result<(), Error> {
    debug!("Receiving on topic with ARN: `{}`", topic_arn);

    let rsp = client
        .publish()
        .topic_arn(topic_arn)
        .message(message)
        .send()
        .await?;

    debug!("Published message: {:?}", rsp);

    Ok(())
}

pub async fn test_topic(client: &Client) -> Result<()> {
    let queue_arn = "arn:aws:sqs:us-east-1:000000000000:requestQueue".to_string();
    let topic_arn = "arn:aws:sns:us-east-1:000000000000:requestUpdatesTopic".to_string();

    list_topics(client).await?;
    subscribe(client, &topic_arn, &queue_arn).await?;
    publish(client, &topic_arn, "test").await?;

    Ok(())
}
