/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import type { Job } from '~/models/db/job';
import { v4 as uuidv4 } from 'uuid';
import { mapJobs, mapJob } from '~/mappers/jobMappers';
import getDynamoDBClient from '~/clients/dynamodb';
import { env } from '~/env.mjs';

import { JobUpdateMessage } from '~/models/sqs/jobUpdateMessage';
import getSNSClient from '~/clients/sns';
import { PublishInput } from 'aws-sdk/clients/sns';
import getAthenaClient from '~/clients/athena';
import { StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import { waitForQueryExecution } from '~/utils/athena';

const DYNAMODB_TABLE = 'mockRequests';
const shortUid = () => uuidv4().substring(0, 8);
const AUTHOR_NAME = env.NEXT_PUBLIC_AUTHOR_NAME;

const SNS_TOPIC_ARN =
  'arn:aws:sns:us-east-1:000000000000:requestUpdatesTopic.fifo';
const SNS_MESSAGE_GROUP_ID = 'updates';

const create_athena_table = async (
  baseQuery: string,
  databaseName: string,
  tableName: string
) => {
  const athena = getAthenaClient();

  // Default output location for query results
  const defaultOutputLocation =
    process.env.ATHENA_QUERY_RESULTS ??
    's3://aws-athena-query-results-000000000000-us-east-1';
  const outputLocation = defaultOutputLocation;

  // Constructing the CTAS query dynamically based on input
  const ctasQuery = `
        CREATE TABLE "${databaseName}"."${tableName}"
        WITH (format = 'JSON', external_location = 's3://metadata/${tableName}')
        AS ${baseQuery}`;

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
  await waitForQueryExecution(athena, queryExecutionId);
};

export const jobRouter = createTRPCRouter({
  getJobs: publicProcedure.query(async () => {
    const dynamodb = getDynamoDBClient();

    const jobQueryParams = {
      TableName: DYNAMODB_TABLE,
      ProjectionExpression:
        'jobName, jobDescription, jobStatus, powerBILink, author, analysisTypes, creationDate, sources, dateRangeStart, dateRangeEnd, granularity, requestID',
    };

    return mapJobs(
      await new Promise((resolve, reject) =>
        dynamodb.scan(jobQueryParams, (err, data) => {
          if (err || !data.Items) {
            console.log(data, err);
            reject(err ?? (!data.Items ? 'No Items' : 'Unknown error'));
          } else {
            //console.log(data.Items);
            resolve(data.Items as unknown as Job[]);
          }
        })
      )
    );
  }),
  getJob: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const dynamodb = getDynamoDBClient();

      const jobQueryParams = {
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: 'requestID = :requestID',
        ExpressionAttributeValues: {
          ':requestID': { S: input.jobId },
        },
        ProjectionExpression:
          'jobName, jobDescription, jobStatus, powerBILink, author, analysisTypes, creationDate, sources, dateRangeStart, dateRangeEnd, granularity, requestID',
      };

      return mapJob(
        await new Promise((resolve, reject) =>
          dynamodb.query(jobQueryParams, (err, data) => {
            if (err || !data.Items) {
              console.log(data, err);
              reject(
                err ??
                  (!data.Items || data.Items.length < 1
                    ? 'No Item'
                    : 'Unknown error')
              );
            } else {
              const job = (data.Items as unknown as Job[])[0];

              if (!job) {
                reject('No Item');
              } else {
                resolve(job);
              }
            }
          })
        )
      );
    }),
  submitJob: publicProcedure
    .input(
      z.object({
        jobName: z
          .string()
          .min(1)
          .refine((data) => data.length > 0, {
            message: 'jobName should have at least 1 character',
          }),
        jobDescription: z.string().refine((data) => data.length > 0, {
          message: 'jobDescription should not be empty',
        }),
        sources: z.array(z.string()).refine((data) => data.length > 0, {
          message: 'sources should not be empty',
        }),
        analysisTypes: z.array(z.string()).refine((data) => data.length > 0, {
          message: 'analysisTypes should not be empty',
        }),
        dateRangeStart: z.number().refine((data) => data > 0, {
          message: 'dateRangeStart should be a valid Date',
        }),
        dateRangeEnd: z.number().refine((data) => data > 0, {
          message: 'dateRangeEnd should be a valid Date',
        }),
        granularity: z.number().refine((data) => data > 0, {
          message: 'granularity should be a positive number',
        }),
      })
    )
    .mutation(async ({ input }) => {
      const requestID = shortUid();

      await create_athena_table(
        'SELECT * FROM mockdata.dataset1 LIMIT 10000',
        'mockdata',
        requestID
      );

      console.log('\nRequestID:\n', requestID);

      const date = Date.now();

      const status = 'PENDING';

      const dynamodb = getDynamoDBClient();

      let dynamodbParams = {
        TableName: DYNAMODB_TABLE,
        Item: {
          id: {
            S: shortUid(),
          },
          requestID: {
            S: requestID,
          },
          creationDate: {
            N: date.toString(),
          },
          jobStatus: {
            S: status,
          },
          jobName: {
            S: input.jobName,
          },
          jobDescription: {
            S: input.jobDescription,
          },
          author: {
            S: AUTHOR_NAME,
          },
          analysisTypes: {
            L: input.analysisTypes.map((type) => ({
              S: type, // TODO check
            })),
          },
          sources: {
            L: input.sources.map((source) => ({
              S: source,
            })),
          },
          powerBILink: {
            // S: input.powerBILink, // TODO fix later
            S: "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value'",
          },
          dateRangeStart: {
            N: input.dateRangeStart.toString(),
          },
          dateRangeEnd: {
            N: input.dateRangeEnd.toString(),
          },
          granularity: {
            N: input.granularity.toString(),
          },
        },
      };
      await dynamodb.putItem(dynamodbParams).promise();

      const jobUpdate = {
        request_id: requestID,
        timestamp: date,
        analysis_types: input.analysisTypes,
        author: AUTHOR_NAME,
        name: input.jobName,
        description: input.jobDescription,
        status: status,
        sources: input.sources,
        dateRangeEnd: new Date(input.dateRangeEnd),
        dateRangeStart: new Date(input.dateRangeStart),
        granularity: input.granularity,
      } as JobUpdateMessage; // Todo: new fields date ranges + granularity?

      const snsClient = getSNSClient();

      const snsClientParams = {
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify(jobUpdate),
        MessageGroupId: SNS_MESSAGE_GROUP_ID,
      } as PublishInput;

      await snsClient.publish(snsClientParams).promise();
    }),
});
