/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import type { Job } from '~/models/db/job';
import { v4 as uuidv4 } from 'uuid';
import mapJobs from '~/mappers/jobMappers';
import getDynamoDBClient from '~/clients/dynamodb';
import getSQSClient from '~/clients/sqs';

const QUEUE_NAME = 'requestQueue';
const DYNAMODB_TABLE = 'mockRequests';
const shortUid = () => uuidv4().substring(0, 8);

export const jobRouter = createTRPCRouter({
  getJobs: publicProcedure.query(async () => {
    const dynamodb = getDynamoDBClient();

    const jobQueryParams = {
      TableName: DYNAMODB_TABLE,
      ProjectionExpression:
        'jobName, jobDescription, jobStatus, powerBILink, author, analysisTypes, creationDate, sources, requestID',
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
      })
    )
    .mutation(async ({ input }) => {
      const sqs = getSQSClient();

      const requestID = shortUid();
      console.log('\nRequestID:\n', requestID);
      const message = { requestID: requestID, ...input };

      const queueUrlResponse = await sqs
        .getQueueUrl({ QueueName: QUEUE_NAME })
        .promise();
      const queueUrl = queueUrlResponse.QueueUrl;

      if (!queueUrl) {
        throw new Error('Failed to get the SQS queue URL');
      }

      let sqsParams = {
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl,
      };

      await sqs.sendMessage(sqsParams).promise();

      const dynamodb = getDynamoDBClient();

      // set status in DynamoDB to QUEUED
      const status = 'QUEUED';
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
            N: Date.now().toString(),
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
            // S: input.author, // TODO do we have author name yet?
            S: 'Test Author',
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
        },
      };
      await dynamodb.putItem(dynamodbParams).promise();
    }),
});
