use aws_config::SdkConfig;
use aws_sdk_sqs::Error;
use aws_sdk_sqs::{config::Builder, Client};
use aws_sdk_sqs::types::QueueAttributeName;
use chrono::{TimeZone, Utc};

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
    Ok(queues
        .queue_urls()
        .first()
        .expect("No queues in this account and Region. Create a queue to proceed.")
        .to_string())
}

pub async fn list_old_queues(client: &Client) -> Result<Vec<String>, Error> {
    let response = client.list_queues().send().await?;
    
    let queue_urls = response
        .queue_urls()
        .iter()
        .map(|s| s.to_string())
        .collect();

    let old_queue_urls : Vec<String> = Vec::new();

    for queue_url in old_queue_urls {
        if let Some(queue_age) = get_queue_age(client, &queue_url).await {
            old_queue_urls.append(queue_url);
        }
    }

    Ok(old_queue_urls)
}

pub async fn get_queue_age(client: &Client, queue_url: &String) -> Option<&String> {
    let response = client
        .get_queue_attributes()
        .queue_url(queue_url)
        .attribute_names(vec![&QueueAttributeName::CreatedTimestamp])
        .send()
        .await?;

    if let Some(attributes) = response.attributes {
        if let Some(created_timestamp) = attributes.get(&QueueAttributeName::CreatedTimestamp) {
            let created_time = Utc.timestamp_opt(created_timestamp.parse::<i64>().unwrap(), 0);
            let now = Utc::now();
            let duration = now.signed_duration_since(created_time);
            
            println!("Queue Age: {} days", duration.num_hours());
            
            if duration.num_hours() > 1 {
                return Some(queue_url)
            }
            else {
                return None
            }

        }
    }

    println!("CreatedTimestamp not found");
    None
}

pub async fn delete_queues(client: &Client, queue_urls: Vec<String> ) {
  for queue_url in queue_urls {
    delete_queue(client, &queue_url);
  }
}
pub async fn delete_queue(client: &Client,  queue_url: &String) {
    client
}