use aws_config::SdkConfig;
use aws_sdk_sqs::{config::Builder, Client};
use aws_sdk_sqs::types::QueueAttributeName;
use chrono::Utc;

pub fn sqs_client(conf: &SdkConfig) -> Client {
    let sqs_config_builder = Builder::from(conf);
    Client::from_conf(sqs_config_builder.build())
}

pub async fn list_queues(client: &Client) -> Option<Vec<String>> {
    let response = client.list_queues().send().await.expect("Error fetching queues");
    
    let queue_urls = response
        .queue_urls()
        .iter()
        .map(|s| s.to_string())
        .collect();

    Some(queue_urls)
}

pub async fn get_queue_age(client: &Client, queue_url: &String) -> Option<i64> {
    let response = client
        .get_queue_attributes()
        .queue_url(queue_url)
        .attribute_names(QueueAttributeName::CreatedTimestamp)
        .send()
        .await;

    if let Some(attributes) = response.ok() {
        if let Some(created_timestamp) = attributes.attributes?.get(&QueueAttributeName::CreatedTimestamp) {
            let age: Result<i64, _> = created_timestamp.parse();
            let now = Utc::now().timestamp();
            
            match age {
                Ok(num) => return Some(now - num),
                Err(_) => return None
            }
        }
    }

    println!("CreatedTimestamp not found");
    None
}

pub async fn delete_queue(client: &Client,  queue_url: &String) {
    let delete_queue_result = client.delete_queue().queue_url(queue_url).send().await;

    match delete_queue_result {
        Ok(_) => {},
        Err(e) => {
            println!("Error deleting queues: {}", e.to_string())
        },
    }
}