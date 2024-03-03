use std::fmt;

#[derive(Debug)]
pub struct JobRequest {
    pub id: String,
    pub request_id: String, // db key
    pub author: String,
    pub name: String,
    pub description: String,
    pub analysis_types: Vec<String>,
    pub timestamp: i64,
    pub status: String,
    pub sources: Vec<String>,
}

impl fmt::Display for JobRequest {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "\nrequestID: {} \nID: {} \nName: {} \nDescription: {} \nStatus: {} \nTimestamp: {} \nAnalysis Type(s): {:?} \nSource(s): {:?}",
            self.request_id, self.id, self.name, self.description, self.status, self.timestamp, self.analysis_types, self. sources
        )
    }
}
