use super::status::Status;
use super::{data::TimeSeriesData, job::Job, job_type::JobType};
use eyre::{eyre, Result};
use log::debug;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::{fmt, future::Future, path::PathBuf, pin::Pin, process::Command};

pub trait AnalysisJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>>;
    fn type_name(&self) -> &'static str;
}

struct CorrelationJob;
struct EdaJob;
struct SimulatedJob;
struct SimulatedError;

impl AnalysisJob for SimulatedError {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
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
                return Err(eyre!("SimulatedJob failed: {}", error_message));
            }

            Ok(())
        })
    }

    fn type_name(&self) -> &'static str {
        "SimulatedError"
    }
}

impl AnalysisJob for SimulatedJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
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
            let temp_path = std::str::from_utf8(&output.stdout)?.trim();
            println!("Temporary file path: {}", temp_path);

            Ok(())
        })
    }

    fn type_name(&self) -> &'static str {
        "SimulatedJob"
    }
}

impl AnalysisJob for CorrelationJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
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
                return Err(eyre!("SimulatedJob failed: {}", error_message));
            }
            let temp_path = std::str::from_utf8(&output.stdout)?.trim();
            println!("Temporary file path: {}", temp_path);
            // TODO upload file to s3
            // TODO delete temp file

            Ok(())
        })
    }

    fn type_name(&self) -> &'static str {
        "CorrelationJob"
    }
}

impl AnalysisJob for EdaJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
        Box::pin(async move {
            let job = job.lock().unwrap(); // Lock to access job data

            let output = Command::new("python")
                .arg("analysis/eda_analysis.py")
                .arg(&job.s3_path)
                .arg(&job.request_id)
                .output()?;
            drop(job);

            if !output.status.success() {
                let error_message = String::from_utf8_lossy(&output.stderr);
                return Err(eyre!("SimulatedJob failed: {}", error_message));
            }
            let temp_path = std::str::from_utf8(&output.stdout)?.trim();
            println!("Temporary file path: {}", temp_path);
            // TODO upload file to s3
            // TODO delete temp file

            Ok(())
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

    pub async fn run(&self) -> Result<()> {
        for (job_impl, job_metadata) in &self.jobs {
            {
                // Lock and update the status to Processing
                let mut job = job_metadata.lock().unwrap();
                if let Some(new_status) = job.status.next() {
                    job.status = new_status;
                    debug!("Job {} - {}", job.job_id, job.status);
                }
            } // lock dropped here
            job_impl.run(job_metadata.clone()).await?;
            let mut job = job_metadata.lock().unwrap();
            if let Some(new_status) = job.status.next() {
                job.status = new_status;
                debug!("Job {} - {}", job.job_id, job.status);
            } // lock dropped here
        }
        Ok(())
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
