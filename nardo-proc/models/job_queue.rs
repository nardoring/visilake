use super::{data::TimeSeriesData, job_type::JobType};

use eyre::Result;

trait AnalysisJob {
    fn run(&self, data: &TimeSeriesData) -> Result<TimeSeriesData>;
}

struct CorrelationJob;
struct EdaJob;

impl AnalysisJob for CorrelationJob {
    fn run(&self, data: &TimeSeriesData) -> Result<TimeSeriesData> {
        // TODO Implement correlation analysis on the data
        todo!()
    }
}

impl AnalysisJob for EdaJob {
    fn run(&self, data: &TimeSeriesData) -> Result<TimeSeriesData> {
        // TODO Implement EDA analysis on the data
        todo!()
    }
}

struct JobQueue {
    jobs: Vec<Box<dyn AnalysisJob>>,
}

impl JobQueue {
    fn new() -> Self {
        JobQueue { jobs: Vec::new() }
    }

    fn add_job<T: AnalysisJob + 'static>(&mut self, job: T) {
        self.jobs.push(Box::new(job));
    }

    fn run(&self, mut data: TimeSeriesData) -> Result<TimeSeriesData> {
        for job in &self.jobs {
            data = job.run(&data)?;
        }
        Ok(data)
    }
}

fn create_job_instance(job_type: JobType) -> Box<dyn AnalysisJob> {
    match job_type {
        JobType::Corr => Box::new(CorrelationJob {}),
        JobType::Eda => Box::new(EdaJob {}),
        JobType::None => panic!("Invalid job type for execution"),
    }
}
