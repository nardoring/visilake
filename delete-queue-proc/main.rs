use aws::sqs::{delete_queue, get_queue_age, list_queues, sqs_client};
mod aws;
mod config;
mod utils;

const MAX_QUEUE_AGE: i64 = 30;

const BASE_QUEUE_STIRNG: &str = "requestUpdates";

#[tokio::main]
async fn main() {
    let shared_config = config::configure().await.expect("Config failed");

    let sqs = sqs_client(&shared_config);

    let queues = list_queues(&sqs).await.expect("Error retrieving queues");

    for queue in queues.iter().filter(|&q| q.contains(BASE_QUEUE_STIRNG)) {
        println!("Processing: {}", queue);

        let queue_age = get_queue_age(&sqs, &queue)
            .await
            .expect("Failed getting age");

        if queue_age > MAX_QUEUE_AGE {
            println!("Deleting: {}", queue);
            delete_queue(&sqs, &queue).await;
        }
    }
}
