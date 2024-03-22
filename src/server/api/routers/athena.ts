import { createTRPCRouter, publicProcedure } from '../trpc';
import getAthenaClient from '~/clients/athena';
import { waitForQueryExecution, fetchQueryResults } from '~/utils/athena';
import { z } from 'zod';
import { StartQueryExecutionCommand } from '@aws-sdk/client-athena';

const querySchema = z.object({
  query: z.string(),
});

export const athenaRouter = createTRPCRouter({
  executeQuery: publicProcedure.input(querySchema).query(async ({ input }) => {
    const athena = getAthenaClient();

    const sqlQuery = input.query;

    const startQueryResponse = await athena.send(
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/athena/command/StartQueryExecutionCommand/
      new StartQueryExecutionCommand({
        QueryString: sqlQuery,
        // QueryExecutionContext: {
        //   Database: 'data-catalog-database',
        //   Catalog: 'AwsDataCatalog',
        // },
        ResultConfiguration: {
          OutputLocation:
            's3://aws-athena-query-results-000000000000-us-east-1',
        },
      })
    );

    const queryExecutionId = startQueryResponse.QueryExecutionId;
    console.log('Query ID:', queryExecutionId);
    console.log('Query response:', startQueryResponse);

    if (!queryExecutionId) {
      throw new Error('Failed to obtain queryExecutionId from Athena.');
    }

    const executionDetails = await waitForQueryExecution(
      athena,
      queryExecutionId
    );
    console.log('Query Details:', executionDetails);

    const results = await fetchQueryResults(athena, queryExecutionId);
    console.log('Result:', results);

    return {
      queryExecutionId,
      executionStatus: executionDetails.Status.State,
      results,
    };
  }),
});
