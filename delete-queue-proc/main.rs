use aws::sqs::{delete_queue, get_queue_age, list_queues, sqs_client};
mod config;
mod aws;
mod utils;

const MAX_QUEUE_AGE: i64 = 30;

#[tokio::main]
async fn main() {
    let shared_config = config::configure().await.expect("Config failed");

    let sqs = sqs_client(&shared_config);

    let queues = list_queues(&sqs).await.expect("Error retrieving queues");

    for queue in queues {
        let queue_age = get_queue_age(&sqs, &queue).await.expect("Failed getting age");

        if queue_age > MAX_QUEUE_AGE {
            delete_queue(&sqs, &queue).await;
        }
    }
}
