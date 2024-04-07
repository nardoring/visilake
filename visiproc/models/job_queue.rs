use super::job::Job;
use crate::analysis::analysis_jobs::AnalysisJob;
use eyre::Result;
use log::debug;
use std::{
    fmt,
    sync::{Arc, Mutex},
    vec::IntoIter,
};

pub struct JobQueue {
    jobs: Vec<(Box<dyn AnalysisJob>, Arc<Mutex<Job>>)>,
}

pub struct JobQueueIterator {
    iter: IntoIter<Arc<Mutex<Job>>>,
}

impl Iterator for JobQueueIterator {
    type Item = Arc<Mutex<Job>>;

    fn next(&mut self) -> Option<Self::Item> {
        self.iter.next()
    }
}

impl JobQueue {
    pub fn new() -> Self {
        JobQueue { jobs: Vec::new() }
    }

    pub fn add_job(&mut self, job_impl: Box<dyn AnalysisJob>, job_metadata: Arc<Mutex<Job>>) {
        self.jobs.push((job_impl, job_metadata));
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

            // run job
            job_impl.run(job_metadata.clone()).await?;

            // update job status to complete
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
