import { createTRPCRouter, publicProcedure } from '../trpc';
import getAthenaClient from '~/clients/athena';
import { waitForQueryExecution, fetchQueryResults } from '~/utils/athena';
import { z } from 'zod';
import { StartQueryExecutionCommand } from '@aws-sdk/client-athena';

const querySchema = z.object({
  query: z.string(),
});

export const athenaRouter = createTRPCRouter({
  executeQuery: publicProcedure
    .input(querySchema)
    .mutation(async ({ input }) => {
      const athena = getAthenaClient();

      const sqlQuery = input.query;
      const outputLocation = process.env.ATHENA_QUERY_RESULTS ?? 's3://aws-athena-query-results-000000000000-us-east-1';

      const startQueryResponse = await athena.send(
        new StartQueryExecutionCommand({
          QueryString: sqlQuery,
          ResultConfiguration: {
            OutputLocation: outputLocation,
          },
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
