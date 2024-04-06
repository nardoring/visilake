use crate::aws::s3::{s3_client, upload_object};
use crate::config;
use super::status::Status;
use super::{data::TimeSeriesData, job::Job, job_type::JobType};
use eyre::{eyre, Result};
use log::debug;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::{fmt, future::Future, path::PathBuf, pin::Pin, process::Command};
use tokio::time::Duration;
use tokio::time::sleep;

pub trait AnalysisJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>>;
    fn type_name(&self) -> &'static str;
}

struct CorrelationJob;
struct EdaJob;
struct SimulatedJob;
struct SimulatedError;

impl AnalysisJob for SimulatedError {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
        Box::pin(async move {
            let job = job.lock().unwrap(); // Lock to access job data

            let output = Command::new("python")
                .arg("analysis/simulated_error.py")
                .arg(&job.s3_path)
                .arg(&job.request_id)
                .output()?;
            drop(job);

            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                return Err(eyre!("Simulated Error failed: {}", error_message));
            }

            Ok("".to_string())
        })
    }

    fn type_name(&self) -> &'static str {
        "SimulatedError"
    }
}

impl AnalysisJob for SimulatedJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
        Box::pin(async move {
            let job = job.lock().unwrap(); // Lock to access job data

            let output = Command::new("python")
                .arg("analysis/simulated_analysis.py")
                .arg(&job.s3_path)
                .arg(&job.request_id)
                .output()?;
            drop(job);

            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                return Err(eyre!("SimulatedJob failed: {}", error_message));
            }
            let temp_path = std::str::from_utf8(&output.stdout)?.trim().to_string();
            println!("Temporary file path: {}", temp_path);

            Ok(temp_path)
        })
    }

    fn type_name(&self) -> &'static str {
        "SimulatedJob"
    }
}

impl AnalysisJob for CorrelationJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
        Box::pin(async move {
            let job = job.lock().unwrap(); // Lock to access job data

            let output = Command::new("python")
                .arg("analysis/correlation_analysis.py")
                .arg(&job.s3_path)
                .arg(&job.request_id)
                .output()?;
            drop(job);

            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                return Err(eyre!("Correlation job failed: {}", error_message));
            }
            // let temp_path = std::str::from_utf8(&output.stdout)?.trim();
            let temp_path = std::str::from_utf8(&output.stdout)?.trim().to_string();
            println!("Temporary file path: {}", temp_path);
            // TODO upload file to s3
            // TODO delete temp file

            Ok(temp_path)
        })
    }

    fn type_name(&self) -> &'static str {
        "CorrelationJob"
    }
}

impl AnalysisJob for EdaJob {
    // fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
    //     Box::pin(async move {
    //         let job = job.lock().unwrap(); // Lock to access job data

    //         let output = Command::new("python")
    //             .arg("analysis/eda_analysis.py")
    //             .arg(&job.s3_path)
    //             .arg(&job.request_id)
    //             .output()?;
    //         // let key = format!("{}-eda.html", &job.request_id);
    //         drop(job);

    //         if !output.status.success() {
    //             let error_message = String::from_utf8_lossy(&output.stderr);
    //             return Err(eyre!("EDA job failed: {}", error_message));
    //         }
    //         let temp_path = std::str::from_utf8(&output.stdout)?.trim();
    //         println!("Temporary file path: {}", temp_path);

    //         Ok(())
    //     })
    // }
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
        Box::pin(async move {
            let job = job.lock().unwrap(); // Lock to access job data
            let job_id = &job.request_id.clone();

            // Execute athena to query the dataset
            let shared_config = config::configure().await.unwrap();
            let client = athena_client(&shared_config);
    
            let test_query = "SELECT * FROM mockdata.dataset1 LIMIT 50";
            let database = "mockdata";
            let output_location = "s3://aws-athena-query-results-000000000000-us-east-1";
    
            let query_execution_id =
                start_query_execution(&client, test_query, database, output_location)
                    .await
                    .expect("Failed to start query execution");
    
            let mut status = "".to_string();
            while status != "SUCCEEDED" {
                sleep(Duration::from_secs(5)).await;
                status = check_query_execution_status(&client, &query_execution_id)
                    .await
                    .expect("Failed to check query execution status");
                if status == "FAILED" || status == "CANCELLED" {
                    panic!("Query execution failed or was cancelled");
                }
            }

            // Execute the Python script for EDA analysis
            let output = Command::new("python")
                .arg("analysis/eda_analysis.py")
                .arg(&job.s3_path)
                .arg(&job.request_id)
                .output()?;

            // Release the lock on job as soon as it's no longer needed.
            drop(job);

            // Check if the Python script executed successfully
            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                // Return an error if the script execution failed
                return Err(eyre!("EDA job failed: {}", error_message));
            }

            // Extract the temporary file path from the script's output
            let temp_path = std::str::from_utf8(&output.stdout)?.trim().to_string();
            println!("Temporary file path: {}", temp_path);

            let output = Command::new("awslocal")
                .arg("s3")
                .arg("cp")
                .arg(temp_path.clone())
                .arg(format!("s3://metadata/{}/{}-eda.html", job_id, job_id))
                .output()?;

            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                // Return an error if the script execution failed
                return Err(eyre!("EDA job failed: {}", error_message));
            }

            // Successfully return the temp_path
            Ok(temp_path)
        })
    }
    fn type_name(&self) -> &'static str {
        "EdaJob"
    }
}

pub struct JobQueue {
    jobs: Vec<(Box<dyn AnalysisJob>, Arc<Mutex<Job>>)>,
}

impl JobQueue {
    pub fn new() -> Self {
        JobQueue { jobs: Vec::new() }
    }

    pub fn add_job(&mut self, job_impl: Box<dyn AnalysisJob>, job_metadata: Arc<Mutex<Job>>) {
        self.jobs.push((job_impl, job_metadata));
    }

    pub async fn run(&self) -> Result<String> {
        for (job_impl, job_metadata) in &self.jobs {
            {
                // Lock and update the status to Processing
                let mut job = job_metadata.lock().unwrap();
                if let Some(new_status) = job.status.next() {
                    job.status = new_status;
                    debug!("Job {} - {}", job.job_id, job.status);
                }
            } // lock dropped here

            // run job

            let temp_path = job_impl.run(job_metadata.clone()).await?;

            let shared_config = config::configure().await?;
            let s3_client = s3_client(&shared_config);

            let job = job_metadata.lock().unwrap();
            let key = format!("{}-eda.html", &job.request_id);
            drop(job);

            // upload_object(&s3_client, "mockdata", &temp_path, &key).await?;
            // update job status to complete
            let mut job = job_metadata.lock().unwrap();
            if let Some(new_status) = job.status.next() {
                job.status = new_status;
                debug!("Job {} - {}", job.job_id, job.status);
            } // lock dropped here
        }
        Ok("".to_string())
    }
}

impl fmt::Display for JobQueue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "JobQueue contains {} jobs:", self.jobs.len())?;
        for (index, (job_impl, job_metadata)) in self.jobs.iter().enumerate() {
            let job = job_metadata.lock().unwrap(); // Lock to safely access job details
            writeln!(f, "  Job {}:", index + 1)?;
            writeln!(f, "    Type: {}", job_impl.type_name())?;
            writeln!(f, "    ID: {}", job.job_id)?;
            writeln!(f, "    Status: {}", job.status)?;
            writeln!(f, "    Request ID: {}", job.request_id)?;
            writeln!(f, "    s3 Path: {}", job.s3_path)?;
            drop(job);
        }
        Ok(())
    }
}

pub fn create_job_instance(job_type: JobType) -> Box<dyn AnalysisJob> {
    match job_type {
        JobType::Corr => Box::new(CorrelationJob {}),
        JobType::Eda => Box::new(EdaJob {}),
        JobType::SimulatedJob => Box::new(SimulatedJob {}),
        JobType::SimulatedError => Box::new(SimulatedError {}),
        JobType::None => panic!("Invalid job type for execution"),
    }
}
