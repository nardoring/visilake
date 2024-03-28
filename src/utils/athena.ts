import type { AthenaClient } from '@aws-sdk/client-athena';
import {
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
} from '@aws-sdk/client-athena';

const MAX_RETRIES = 5;

interface ExecutionDetails {
  Status: {
    State: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    StateChangeReason?: string;
  };
}

interface AthenaDatum {
  VarCharValue?: string;
}

export interface AthenaQueryResultRow {
  Data: AthenaDatum[];
}

export async function waitForQueryExecution(
  athenaClient: AthenaClient,
  queryExecutionId: string
): Promise<ExecutionDetails> {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const response = await athenaClient.send(
      new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      })
    );
    console.log('Waiting on query execution: ', response);

    if (!response.QueryExecution) {
      throw new Error(
        'QueryExecution is undefined, unable to check query status.'
      );
    }

    if (!response.QueryExecution.Status) {
      throw new Error(
        'QueryExecution.Status is undefined, unable to determine query state.'
      );
    }

    const { Status } = response.QueryExecution;

    switch (Status.State) {
      case 'SUCCEEDED':
        const executionDetails: ExecutionDetails = {
          Status: {
            State: Status.State,
            StateChangeReason: Status.StateChangeReason ?? '',
          },
        };
        return executionDetails;
      case 'FAILED':
        throw new Error(
          `Query failed. State: ${Status.State}, Reason: ${Status.StateChangeReason ?? 'No reason provided'}`
        );
      case 'CANCELLED':
        throw new Error(
          `Query cancelled. State: ${Status.State}, Reason: ${Status.StateChangeReason ?? 'No reason provided'}`
        );
      default:
        await new Promise((resolve) => setTimeout(resolve, 50));
        attempts++;
        continue;
    }
  }

  throw new Error(
    'Maximum number of retries reached, unable to complete query execution.'
  );
}

export async function fetchQueryResults(
  athenaClient: AthenaClient,
  queryExecutionId: string
): Promise<AthenaQueryResultRow[]> {
  const results: AthenaQueryResultRow[] = [];
  let nextToken: string | undefined;

  console.log('Fetching results for:', queryExecutionId);

  do {
    const { ResultSet, NextToken } = await athenaClient.send(
      new GetQueryResultsCommand({
        QueryExecutionId: queryExecutionId,
        NextToken: nextToken,
      })
    );

    if (!ResultSet?.Rows) {
      throw new Error(
        'ResultSet is undefined, or no rows are present, unable to fetch query results.'
      );
    }

    const transformedRows = ResultSet.Rows.map((row) => ({
      Data:
        row.Data?.map((datum) => ({
          VarCharValue: datum.VarCharValue,
        })) ?? [],
    }));

    results.push(...transformedRows);
    nextToken = NextToken;
  } while (nextToken);

  return results;
}
