use crate::models::{job::Job, job_type::JobType};
use eyre::{eyre, Result};
use log::debug;
use std::sync::{Arc, Mutex};
use std::{future::Future, pin::Pin, process::Command};

struct CorrelationJob;
struct EdaJob;
struct SimulatedJob;
struct SimulatedError;

pub trait AnalysisJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>>;
    fn handle_result(&self, job_id: &str, temp_path: &str) -> Result<()>;
    fn type_name(&self) -> &'static str;
    fn script_path(&self) -> &'static str;
}

impl AnalysisJob for EdaJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
        run_job(self, job)
    }

    fn handle_result(&self, job_id: &str, temp_path: &str) -> Result<()>{
        let output = Command::new("awslocal")
            .arg("s3")
            .arg("cp")
            .arg(temp_path)
            .arg(format!("s3://metadata/{}/{}-eda.html", job_id, job_id))
            .output()?;

        if !output.status.success() {
            let error_message = String::from_utf8_lossy(&output.stderr);
            return Err(eyre!("S3 eda report upload failed: {}", error_message));
        }

        let output_data = Command::new("awslocal")
            .arg("s3")
            .arg("cp")
            .arg(temp_path.replace("-eda.html", "-data.parquet"))
            .arg(format!("s3://metadata/{}/{}-data.parquet", job_id, job_id))
            .output()?;

        if !output_data.status.success() {
            let error_message = String::from_utf8_lossy(&output_data.stderr);
            return Err(eyre!("S3 data upload failed: {}", error_message));
        }

        debug!("Job result file uploaded for {}", job_id);
        Ok(())
    }

    fn type_name(&self) -> &'static str {
        "EdaJob"
    }

    fn script_path(&self) -> &'static str {
        "python_jobs/eda_analysis.py"
    }
}

impl AnalysisJob for CorrelationJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
        run_job(self, job)
    }

    fn handle_result(&self, job_id: &str, temp_path: &str) -> Result<()>{
        debug!("Correlation Job: {} - {}", job_id, temp_path);
        Ok(())
    }

    fn type_name(&self) -> &'static str {
        "Correlation Job"
    }

    fn script_path(&self) -> &'static str {
        "python_jobs/correlation_analysis.py"
    }
}

impl AnalysisJob for SimulatedJob {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
        run_job(self, job)
    }

    fn handle_result(&self, job_id: &str, temp_path: &str) -> Result<()>{
        debug!("Simulated job: {} - {}", job_id, temp_path);
        Ok(())
    }

    fn type_name(&self) -> &'static str {
        "Simulated Job"
    }
    fn script_path(&self) -> &'static str {
        "python_jobs/simulated_analysis.py"
    }
}

impl AnalysisJob for SimulatedError {
    fn run(&self, job: Arc<Mutex<Job>>) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
        run_job(self, job)
    }

    fn handle_result(&self, job_id: &str, temp_path: &str) -> Result<()>{
        debug!("Simulated Error: {} - {}", job_id, temp_path);
        Ok(())
    }

    fn type_name(&self) -> &'static str {
        "Simulated Error"
    }
    fn script_path(&self) -> &'static str {
        "python_jobs/simulated_error.py"
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

fn run_job<T: AnalysisJob + ?Sized + std::marker::Sync>(
    analysis_job: &T,
    job: Arc<Mutex<Job>>,
) -> Pin<Box<dyn Future<Output = Result<()>> + Send + '_>> {
    Box::pin(async move {
        let locked_job = job.lock().unwrap(); // Lock to access job data
        let job_id = &locked_job.request_id.clone();

        let output = Command::new("python")
            .arg(analysis_job.script_path())
            .arg(&locked_job.s3_path)
            .arg(&locked_job.request_id)
            .output()?;
        drop(locked_job);

        if !output.status.success() {
            let error_message = String::from_utf8_lossy(&output.stderr);
            return Err(eyre!("Job analysis run failed: {}", error_message));
        }

        let temp_path = std::str::from_utf8(&output.stdout)?.trim().to_string();
        debug!("Temporary file path: {}", temp_path);

        analysis_job.handle_result(job_id, &temp_path)?;

        Ok(())
    })
}
