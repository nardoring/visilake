import { createTRPCRouter, publicProcedure } from '../trpc';
import getAthenaClient from '~/clients/athena';
import { waitForQueryExecution, fetchQueryResults } from '~/utils/athena';
import { z } from 'zod';
import { StartQueryExecutionCommand } from '@aws-sdk/client-athena';

const querySchema = z.object({
  baseQuery: z.string(),
  newTableName: z.string(),
  databaseName: z.string(),
  outputLocation: z.string().optional(),
});

export const athenaRouter = createTRPCRouter({
  executeCTASQuery: publicProcedure
    .input(querySchema)
    .mutation(async ({ input }) => {
      const athena = getAthenaClient();

      // Default output location for query results
      const defaultOutputLocation =
        process.env.ATHENA_QUERY_RESULTS ??
        's3://aws-athena-query-results-000000000000-us-east-1';
      const outputLocation = input.outputLocation ?? defaultOutputLocation;

      // Constructing the CTAS query dynamically based on input
      const ctasQuery = `
        CREATE TABLE "${input.databaseName}"."${input.newTableName}"
        WITH (external_location = '${outputLocation}')
        AS ${input.baseQuery}`;

      const startQueryResponse = await athena.send(
        new StartQueryExecutionCommand({
          QueryString: ctasQuery,
          ResultConfiguration: { OutputLocation: outputLocation },
        })
      );

      const queryExecutionId = startQueryResponse.QueryExecutionId;
      if (!queryExecutionId) {
        throw new Error('Failed to obtain queryExecutionId from Athena.');
      }

      const executionDetails = await waitForQueryExecution(
        athena,
        queryExecutionId
      );
      const results = await fetchQueryResults(athena, queryExecutionId);

      return {
        queryExecutionId,
        executionStatus: executionDetails.Status.State,
        results,
      };
    }),
});
