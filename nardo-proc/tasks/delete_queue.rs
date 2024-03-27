use aws_sdk_sqs::Client;
use crate::aws::sqs::{delete_queue, get_queue_age};

const MAX_QUEUE_HOURS: i64 = 2;

const MAX_QUEUE_AGE: i64 = MAX_QUEUE_HOURS * 60 * 60;

const BASE_QUEUE_STIRNG: &str = "requestUpdates";

async fn delete_old_queues(sqs_client: &Client, queues: Vec<String>) {
    let shared_config = config::configure().await.expect("Config failed");

    for queue in queues.iter().filter(|&q| q.contains(BASE_QUEUE_STIRNG)) {
        debug!("Processing: {}", queue);

        let queue_age = get_queue_age(sqs_client, &queue)
            .await
            .expect("Failed getting age");

        if queue_age > MAX_QUEUE_AGE {
            debug!("Deleting: {}", queue);
            delete_queue(sqs_client, &queue).await;
        }
    }
}
