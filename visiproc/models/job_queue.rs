use super::status::Status;
use super::{data::TimeSeriesData, job::Job, job_type::JobType};
use crate::aws::s3::{s3_client, upload_object};
use crate::config;
use eyre::{eyre, Result};
use log::{debug, info};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::vec::IntoIter;
use std::{fmt, future::Future, path::PathBuf, pin::Pin, process::Command};
use tokio::time::sleep;
use tokio::time::Duration;
use tracing_subscriber::fmt::format;

pub trait AnalysisJob {
    fn run(
        &self,
        job: Arc<Mutex<Job>>,
    ) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>>;
    fn type_name(&self) -> &'static str;
}

struct CorrelationJob;
struct EdaJob;
struct SimulatedJob;
struct SimulatedError;

impl AnalysisJob for SimulatedError {
    fn run(
        &self,
        job: Arc<Mutex<Job>>,
    ) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
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
    fn run(
        &self,
        job: Arc<Mutex<Job>>,
    ) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
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
    fn run(
        &self,
        job: Arc<Mutex<Job>>,
    ) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
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

            let temp_path = std::str::from_utf8(&output.stdout)?.trim().to_string();
            println!("Temporary file path: {}", temp_path);

            Ok(temp_path)
        })
    }

    fn type_name(&self) -> &'static str {
        "CorrelationJob"
    }
}

impl AnalysisJob for EdaJob {
    fn run(
        &self,
        job: Arc<Mutex<Job>>,
    ) -> Pin<Box<dyn Future<Output = Result<String>> + Send + '_>> {
        Box::pin(async move {
            let job = job.lock().unwrap(); // Lock to access job data
            let job_id = &job.request_id.clone();

            // Execute the Python script for EDA analysis
            let output = Command::new("python")
                .arg("analysis/eda_analysis.py")
                .arg(&job.s3_path)
                .arg(&job.request_id)
                .output()?;
            drop(job);

            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                return Err(eyre!("EDA job failed: {}", error_message));
            }

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
                return Err(eyre!("EDA job failed: {}", error_message));
            }

            let output_data = Command::new("awslocal")
                .arg("s3")
                .arg("cp")
                .arg(format!("./outputs/{}/{}-data.parquet", job_id, job_id))
                .arg(format!("s3://metadata/{}/{}-data.parquet", job_id, job_id))
                .output()?;

            if !output_data.status.success() {
                let error_message = String::from_utf8_lossy(&output_data.stderr);
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

pub struct JobQueueIterator {
    iter: IntoIter<Arc<Mutex<Job>>>,
}

impl JobQueue {
    pub fn new() -> Self {
        JobQueue { jobs: Vec::new() }
    }

    pub fn add_job(&mut self, job_impl: Box<dyn AnalysisJob>, job_metadata: Arc<Mutex<Job>>) {
        self.jobs.push((job_impl, job_metadata));
        // debug!("{:#}", self);
    }

    pub fn iter(&self) -> JobQueueIterator {
        let jobs_only = self
            .jobs
            .iter()
            .map(|(_, job_meta)| job_meta.clone())
            .collect::<Vec<_>>();
        JobQueueIterator {
            iter: jobs_only.into_iter(),
        }
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
            job_impl.run(job_metadata.clone()).await?;

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

impl Iterator for JobQueueIterator {
    type Item = Arc<Mutex<Job>>;

    fn next(&mut self) -> Option<Self::Item> {
        self.iter.next()
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
