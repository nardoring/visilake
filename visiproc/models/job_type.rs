use super::job_request::JobRequest;
use eyre::Result;
use serde::{
    de::{self, Visitor},
    Deserialize, Deserializer, Serialize, Serializer,
};
use std::{error::Error, fmt, str::FromStr};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobType {
    Eda,
    Corr,
    SimulatedJob,
    SimulatedError,
    None,
}

#[derive(Debug, Clone)]
pub struct ParseJobTypeError;

impl fmt::Display for ParseJobTypeError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "invalid job_type")
    }
}

impl Error for ParseJobTypeError {}

impl FromStr for JobType {
    type Err = ParseJobTypeError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Exploratory Data Analysis" => Ok(JobType::Eda),
            "Correlation" => Ok(JobType::Corr),
            "Simulated Job" => Ok(JobType::SimulatedJob),
            "Simulated Error" => Ok(JobType::SimulatedError),
            "NONE" => Ok(JobType::None),
            _ => Err(ParseJobTypeError),
        }
    }
}

impl fmt::Display for JobType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let job_type_str = match self {
            JobType::Eda => "Exploratory Data Analysis",
            JobType::Corr => "Correlation",
            JobType::SimulatedJob => "Simulated Job",
            JobType::SimulatedError => "Simulated Error",
            JobType::None => "NONE",
        };
        write!(f, "{}", job_type_str)
    }
}

impl JobType {
    pub fn from_request(job_request: &JobRequest) -> Vec<Self> {
        job_request
            .analysis_types
            .iter()
            .filter_map(|analysis_type| {
                match analysis_type.as_str() {
                    "Exploratory Data Analysis" => Some(JobType::Eda),
                    "Correlation" => Some(JobType::Corr),
                    "Simulated Job" => Some(JobType::SimulatedJob),
                    "Simulated Error" => Some(JobType::SimulatedError),
                    _ => None, // Skip unknown analysis types
                }
            })
            .collect()
    }
}

pub fn _serialize_job_type<S>(job_type: &JobType, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&job_type.to_string())
}

pub fn serialize_job_types<S>(job_types: &[JobType], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let job_types_str: Vec<String> = job_types.iter().map(|jt| jt.to_string()).collect();
    serializer.serialize_some(&job_types_str)
}

pub fn _deserialize_job_type<'de, D>(deserializer: D) -> Result<JobType, D::Error>
where
    D: Deserializer<'de>,
{
    struct JobTypeVisitor;

    impl<'de> Visitor<'de> for JobTypeVisitor {
        type Value = JobType;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a string representing a job job_type")
        }

        fn visit_str<E>(self, value: &str) -> Result<JobType, E>
        where
            E: de::Error,
        {
            value.parse::<JobType>().map_err(E::custom)
        }
    }

    deserializer.deserialize_str(JobTypeVisitor)
}

pub fn deserialize_job_types<'de, D>(deserializer: D) -> Result<Vec<JobType>, D::Error>
where
    D: Deserializer<'de>,
{
    struct JobTypesVisitor;

    impl<'de> Visitor<'de> for JobTypesVisitor {
        type Value = Vec<JobType>;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a list of strings representing job types")
        }

        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: de::SeqAccess<'de>,
        {
            let mut job_types = Vec::new();

            while let Some(job_type_str) = seq.next_element::<String>()? {
                job_types.push(job_type_str.parse::<JobType>().map_err(de::Error::custom)?);
            }

            Ok(job_types)
        }
    }

    deserializer.deserialize_seq(JobTypesVisitor)
}
