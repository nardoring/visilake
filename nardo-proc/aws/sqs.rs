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
    debug!("Queues: {:#?}", queues);
    Ok(queues
        .queue_urls()
        .first()
        .expect("No queues in this account and Region. Create a queue to proceed.")
        .to_string())
}

pub async fn list_queues(client: &Client) -> Result<Vec<String>, Error> {
    let response = client.list_queues().send().await?;

    let queue_urls = response
        .queue_urls()
        .iter()
        .map(|s| s.to_string())
        .collect();
    debug!("URLS: {:#?}", queue_urls);

    Ok(queue_urls)
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

async fn delete_message(client: &Client, url: &str, receipt_handle: &str) -> Result<(), Error> {
    client
        .delete_message()
        .queue_url(url)
        .receipt_handle(receipt_handle)
        .send()
        .await?;

    Ok(())
}

async fn receive_and_delete_messages(client: &Client, url: &String) -> Result<(), Error> {
    let message = client
        .receive_message()
        .queue_url(url)
        .send()
        .await?
        .messages
        .unwrap_or_default();

    for message in message {
        if let Some(receipt_handle) = message.receipt_handle() {
            debug!("Processing message: {:?}", message);

            delete_message(client, url, receipt_handle).await?;
        }
    }

    Ok(())
}

pub async fn get_message(client: &Client, url: &String) -> Result<()> {
    Ok(receive(&client, url).await?)
}

pub async fn send_message(client: &Client, url: &String, message: &str) -> Result<()> {
    let sqsmessage = SQSMessage {
        body: message.to_owned(),
    };

    Ok(send(&client, url, &sqsmessage).await?)
}

pub async fn get_queue_age(client: &Client, queue_url: &String) -> Option<i64> {
    let response = client
        .get_queue_attributes()
        .queue_url(queue_url)
        .attribute_names(QueueAttributeName::CreatedTimestamp)
        .send()
        .await;

    if let Some(attributes) = response.ok() {
        if let Some(created_timestamp) = attributes
            .attributes?
            .get(&QueueAttributeName::CreatedTimestamp)
        {
            let age: Result<i64, _> = created_timestamp.parse();
            let now = Utc::now().timestamp();

            match age {
                Ok(num) => return Some(now - num),
                Err(_) => return None,
            }
        }
    }

    debug!("CreatedTimestamp not found");
    None
}

pub async fn delete_queue(client: &Client, queue_url: &String) {
    let delete_queue_result = client.delete_queue().queue_url(queue_url).send().await;

    match delete_queue_result {
        Ok(_) => {}
        Err(e) => {
            debug!("Error deleting queue: {}", e.to_string())
        }
    }
}
