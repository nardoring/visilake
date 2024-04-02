use aws_config::SdkConfig;
use aws_sdk_athena::{
    config::Builder,
    operation::{
        get_query_execution::GetQueryExecutionInput,
        start_query_execution::StartQueryExecutionInput,
    },
    types::{QueryExecutionContext, ResultConfiguration},
    Client,
};
use eyre::{Error, Result};
use log::debug;

pub fn athena_client(conf: &SdkConfig) -> Client {
    let athena_config_builder = Builder::from(conf);
    Client::from_conf(athena_config_builder.build())
}

pub async fn start_query_execution(
    client: &Client,
    query: &str,
    database: &str,
    output_location: &str,
) -> Result<String, Error> {
    let response = client
        .start_query_execution()
        .query_string(query)
        .query_execution_context(QueryExecutionContext::builder().database(database).build())
        .result_configuration(
            ResultConfiguration::builder()
                .output_location(output_location)
                .build(),
        )
        .send()
        .await?;

    if let Some(query_execution_id) = response.query_execution_id {
        Ok(query_execution_id.to_string())
    } else {
        Err(Error::msg("No query execution ID found"))
    }
}

pub async fn check_query_execution_status(
    client: &Client,
    query_execution_id: &str,
) -> Result<String, Error> {
    let response = client
        .get_query_execution()
        .query_execution_id(query_execution_id)
        .send()
        .await?;

    if let Some(query_execution) = response.query_execution {
        if let Some(status) = query_execution.status {
            if let Some(state) = status.state {
                Ok(state.as_str().to_string())
            } else {
                Err(Error::msg("Query execution state not found"))
            }
        } else {
            Err(Error::msg("Query execution status not found"))
        }
    } else {
        Err(Error::msg("Query execution not found"))
    }
}

pub async fn get_query_results(
    client: &Client,
    query_execution_id: &str,
) -> Result<Vec<Vec<String>>, Error> {
    let response = client
        .get_query_results()
        .query_execution_id(query_execution_id)
        .send()
        .await?;

    let rows = response
        .result_set()
        .map(|rs| {
            rs.rows.as_ref().map_or_else(Vec::new, |rows| {
                rows.iter()
                    .map(|row| {
                        row.data.as_ref().map_or_else(Vec::new, |data| {
                            data.iter()
                                .map(|datum| {
                                    datum
                                        .var_char_value
                                        .as_deref()
                                        .unwrap_or_default()
                                        .to_string()
                                })
                                .collect()
                        })
                    })
                    .collect()
            })
        })
        .unwrap_or_default();

    Ok(rows)
}

pub async fn execute_ctas_query(
    client: &Client,
    ctas_query: &str,
    new_table: &str,
    database: &str,
    output_location: &str,
) -> Result<String, Error> {
    let ctas_query_format = format!(
        "CREATE TABLE {} WITH (format = 'Parquet', parquet_compression = 'SNAPPY') AS {}",
        new_table, ctas_query
    );

    let response = client
        .start_query_execution()
        .query_string(ctas_query)
        .query_execution_context(QueryExecutionContext::builder().database(database).build())
        .result_configuration(
            ResultConfiguration::builder()
                .output_location(output_location)
                .build(),
        )
        .send()
        .await?;

    if let Some(query_execution_id) = response.query_execution_id {
        Ok(query_execution_id.to_string())
    } else {
        Err(Error::msg("Failed to start CTAS query execution"))
    }
}

#[cfg(test)]
mod tests {
    use crate::config;

    use super::*;
    use aws_config::load_from_env;
    use std::env;
    use tokio::time::{sleep, Duration};

    #[tokio::test]
    async fn test_query_execution_and_fetch_results() {
        let shared_config = config::configure().await.unwrap();
        let client = athena_client(&shared_config);

        let test_query = "SELECT * FROM mockdata.dataset1 LIMIT 2";
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

        let results = get_query_results(&client, &query_execution_id)
            .await
            .expect("Failed to get query results");

        assert_eq!(
            results.len(),
            3,
            "Expected 2 rows in the query results and one row header"
        );
    }

    #[tokio::test]
    async fn test_ctas_execution_and_check_table_exists() {
        let shared_config = config::configure().await.unwrap();
        let client = athena_client(&shared_config);

        let test_query = "SELECT * FROM mockdata.dataset1 LIMIT 2";
        let new_table = "test_table_ctas";
        let database = "mockdata";
        let output_location = "s3://metadata/test-jobID/athena-queries";

        let query_execution_id =
            execute_ctas_query(&client, test_query, new_table, database, output_location)
                .await
                .expect("Failed to start query execution");

        let mut status = "".to_string();
        while status != "SUCCEEDED" {
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            status = check_query_execution_status(&client, &query_execution_id)
                .await
                .expect("Failed to check query execution status");
            if status == "FAILED" || status == "CANCELLED" {
                panic!("Query execution failed or was cancelled");
            }
        }

        let check_table_query = format!("SHOW TABLES LIKE '{}'", new_table);
        let check_query_execution_id =
            start_query_execution(&client, &check_table_query, database, output_location)
                .await
                .expect("Failed to start table check query execution");

        let mut check_status = "".to_string();
        while check_status != "SUCCEEDED" {
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            check_status = check_query_execution_status(&client, &check_query_execution_id)
                .await
                .expect("Failed to check table existence query execution status");
            if check_status == "FAILED" || check_status == "CANCELLED" {
                panic!("Table existence query execution failed or was cancelled");
            }
        }
    }
}
