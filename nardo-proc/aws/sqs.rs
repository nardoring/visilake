use aws_config::SdkConfig;
use aws_sdk_sqs::{config::Builder, Client};
use eyre::{Error, Result};
use log::debug;

#[derive(Debug)]
struct SQSMessage {
    body: String,
}

pub fn sqs_client(conf: &SdkConfig) -> Client {
    let sqs_config_builder = Builder::from(conf);
    Client::from_conf(sqs_config_builder.build())
}

async fn find_queue(client: &Client) -> Result<String, Error> {
    let queues = client.list_queues().send().await?;
    debug!("Queues: {:?}", queues);
    Ok(queues
        .queue_urls()
        .first()
        .expect("No queues in this account and Region. Create a queue to proceed.")
        .to_string())
}

async fn send(client: &Client, queue_url: &String, message: &SQSMessage) -> Result<(), Error> {
    println!("Sending message to queue with URL: {}", queue_url);

    let rsp = client
        .send_message()
        .queue_url(queue_url)
        .message_body(&message.body)
        .send()
        .await?;

    debug!("Send message to the queue: {:#?}", rsp);

    Ok(())
}

async fn receive(client: &Client, queue_url: &String) -> Result<()> {
    client
        .receive_message()
        .queue_url(queue_url)
        .send()
        .await?
        .messages
        .unwrap_or_default()
        .into_iter()
        .for_each(|message| {
            debug!("{} got the message:\n {:#?}", queue_url, message);
        });

    Ok(())
}

pub async fn get_message(client: &Client) -> Result<()> {
    let queue_url = find_queue(&client).await?;
    Ok(receive(&client, &queue_url).await?)
}

pub async fn send_message(client: &Client, message: &str) -> Result<()> {
    let queue_url = find_queue(&client).await?;

    let sqsmessage = SQSMessage {
        body: message.to_owned(),
    };

    Ok(send(&client, &queue_url, &sqsmessage).await?)
}
