import { z } from 'zod';
import getDynamoDBClient from '~/clients/dynamodb';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

const DYNAMODB_TABLE = 'sourceTags';

export const sourceRouter = createTRPCRouter({
  validateSource: publicProcedure
    .input(z.object({ sourceTag: z.string() }))
    .query(async ({ input }) => {
      try {
        const dynamodb = getDynamoDBClient();

        const params = {
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: 'sourceTag = :sourceTag',
          ExpressionAttributeValues: {
            ':sourceTag': { S: input.sourceTag },
          },
        };

        const result = await dynamodb.query(params).promise();

        if (result.Items && result.Items.length > 0) {
          return {
            isValid: true,
          };
        } else {
          return {
            isValid: false,
            errorMessage: `${input.sourceTag} was not found in the Data Lake`,
          };
        }
      } catch (error) {
        return {
          isValid: false,
          errorMessage: 'An error occurred while querying the database',
        };
      }
    }),
});