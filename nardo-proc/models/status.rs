use eyre::Result;
use serde::{
    de::{self, Visitor},
    Deserializer, Serializer,
};
use std::{error::Error, fmt, str::FromStr};

#[derive(Debug)]
pub enum Status {
    Pending,
    Queued,
    Processing,
    Completed,
    Failed,
}

#[derive(Debug, Clone)]
pub struct ParseStatusError;

impl fmt::Display for ParseStatusError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "invalid status")
    }
}

impl Error for ParseStatusError {}

impl FromStr for Status {
    type Err = ParseStatusError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "PENDING" => Ok(Status::Pending),
            "QUEUED" => Ok(Status::Queued),
            "PROCESSING" => Ok(Status::Processing),
            "COMPLETE" => Ok(Status::Completed),
            "FAILED" => Ok(Status::Failed),
            _ => Err(ParseStatusError),
        }
    }
}

impl fmt::Display for Status {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let status_str = match self {
            Status::Pending => "PENDING",
            Status::Queued => "QUEUED",
            Status::Processing => "PROCESSING",
            Status::Completed => "COMPLETE",
            Status::Failed => "FAILED",
        };
        write!(f, "{}", status_str)
    }
}

impl Status {
    pub fn next(&self) -> Option<Status> {
        match self {
            Status::Pending => Some(Status::Queued),
            Status::Queued => Some(Status::Processing),
            Status::Processing => Some(Status::Completed),
            Status::Completed | Status::Failed => None,
        }
    }
}

pub fn serialize_status<S>(status: &Status, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&status.to_string())
}

pub fn serialize_statuses<S>(statuses: &[Status], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let statuses_str: Vec<String> = statuses.iter().map(|jt| jt.to_string()).collect();
    serializer.serialize_some(&statuses_str)
}

pub fn deserialize_status<'de, D>(deserializer: D) -> Result<Status, D::Error>
where
    D: Deserializer<'de>,
{
    struct StatusVisitor;

    impl<'de> Visitor<'de> for StatusVisitor {
        type Value = Status;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a string representing a job status")
        }

        fn visit_str<E>(self, value: &str) -> Result<Status, E>
        where
            E: de::Error,
        {
            value.parse::<Status>().map_err(E::custom)
        }
    }

    deserializer.deserialize_str(StatusVisitor)
}

pub fn deserialize_statuses<'de, D>(deserializer: D) -> Result<Vec<Status>, D::Error>
where
    D: Deserializer<'de>,
{
    struct StatusesVisitor;

    impl<'de> Visitor<'de> for StatusesVisitor {
        type Value = Vec<Status>;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a list of strings representing job statuses")
        }

        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: de::SeqAccess<'de>,
        {
            let mut statuses = Vec::new();

            while let Some(job_status_str) = seq.next_element::<String>()? {
                statuses.push(
                    job_status_str
                        .parse::<Status>()
                        .map_err(de::Error::custom)?,
                );
            }

            Ok(statuses)
        }
    }

    deserializer.deserialize_seq(StatusesVisitor)
}
