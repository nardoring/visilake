#![allow(unused_imports)]
// #![allow(unused_variables)]
mod aws;
mod config;
mod models;
mod tasks;
mod utils;

pub(crate) use crate::{
    aws::{
        dynamodb::dynamodb_client,
        sns::{list_topics, sns_client},
        sqs::{delete_old_queues, get_message, list_queues, sqs_client},
    },
    tasks::queue::queue_new_requests,
    utils::init_logging,
};
use aws::s3::{list_buckets, list_objects, s3_client};

use clap::{Parser, Subcommand};
use eyre::Result;
use models::job_queue::{self, JobQueue};
use std::{
    io::{self, Write},
    sync::Arc,
};

struct Clients {
    dynamodb: Arc<aws_sdk_dynamodb::Client>,
    sns: Arc<aws_sdk_sns::Client>,
    sqs: Arc<aws_sdk_sqs::Client>,
    s3: Arc<aws_sdk_s3::Client>,
}

#[derive(Debug, Parser)]
#[command(multicall = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    /// List topics from AWS SNS
    ListTopics,
    /// List queues from AWS SQS
    ListQueues,
    /// List buckets and objects from AWS s3
    ListS3,
    /// List messages from AWS SQS
    ListMessages,
    /// Queue jobs
    QueueJobs,
    /// Process queued jobs
    ProcessQueuedJobs,
    /// Injest parquet and display it
    TestParquet,
    /// Deletes old update topic queues
    DeleteQueues,
    /// Exits the REPL
    Exit,
}

async fn respond(line: &str, clients: &Clients) -> Result<bool, eyre::Report> {
    let args = shlex::split(line).ok_or_else(|| eyre::eyre!("Invalid quoting"))?;
    let cli = Cli::try_parse_from(args)?;

    let queues = list_queues(&clients.sqs).await?;
    let topics = list_topics(&clients.sns).await?;

    // not an AWS SQS, this is the queue for the actual python jobs running
    let mut job_queue = JobQueue::new();

    match cli.command {
        Commands::ListTopics => {
            println!("Topics: {:#?}", topics)
        }
        Commands::ListQueues => {
            println!("Queues: {:#?}", queues)
        }
        Commands::ListS3 => {
            let buckets = list_buckets(&clients.s3).await?;
            println!("Buckets: {:#?}\n", buckets);
            for bucket in buckets {
                let objects = list_objects(&clients.s3, &bucket).await?;
                println!("Objects: {:#?}", objects);
            }
        }
        Commands::ListMessages => {
            for queue in queues {
                get_message(&clients.sqs, &queue).await?;
            }
        }
        Commands::QueueJobs => {
            queue_new_requests(&clients.dynamodb, &clients.sns, &topics, &mut job_queue).await?;
        }
        Commands::ProcessQueuedJobs => {
            job_queue.run().await?;
        }
        Commands::TestParquet => {
            todo!()
        }
        Commands::DeleteQueues => {
            delete_old_queues(&clients.sqs, queues).await;
        }
        Commands::Exit => {
            write!(std::io::stdout(), "Exiting ...")?;
            std::io::stdout().flush()?;
            return Ok(true);
        }
    }
    Ok(false)
}

#[tokio::main]
async fn main() -> Result<()> {
    let _init_logging = init_logging()?;
    let shared_config = config::configure().await?;

    let clients = Clients {
        dynamodb: Arc::new(dynamodb_client(&shared_config)),
        sns: Arc::new(sns_client(&shared_config)),
        sqs: Arc::new(sqs_client(&shared_config)),
        s3: Arc::new(s3_client(&shared_config)),
    };

    loop {
        print!("$ ");
        io::stdout().flush().unwrap();

        let mut command = String::new();
        io::stdin().read_line(&mut command)?;
        let command = command.trim();

        match respond(command, &clients).await {
            Ok(quit) => {
                if quit {
                    break;
                }
            }
            Err(err) => {
                writeln!(std::io::stdout(), "{err}")?;
                std::io::stdout().flush()?;
            }
        }
    }
    Ok(())
}
