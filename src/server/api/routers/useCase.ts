/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { UseCase } from "~/models/db/useCase";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import mapUseCases from "~/mappers/useCaseMappers";

const QUEUE_NAME = "requestQueue";
const DYNAMODB_TABLE = "mockRequests";
const shortUid = () => uuidv4().substring(0, 8);

export const useCaseRouter = createTRPCRouter({
  getUseCases: publicProcedure.query(async () => {
    // TODO fix endpoint
    const dynamodb = new AWS.DynamoDB({
      endpoint: "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/",
      region: "us-east-1",
    });

    const useCaseQueryParams = {
      TableName: DYNAMODB_TABLE,
      ProjectionExpression:
        "useCaseName, useCaseDescription, useCaseStatus, powerBILink, author, analysisTypes, creationDate",
    };

    return mapUseCases(
      await new Promise((resolve, reject) =>
        dynamodb.scan(useCaseQueryParams, (err, data) => {
          if (err || !data.Items) {
            console.log(data, err);
            reject(err ?? (!data.Items ? "No Items" : "Unknown error"));
          } else {
            console.log(data.Items);
            resolve(data.Items as unknown as UseCase[]);
          }
        }),
      ),
    );
  }),

  submitUseCase: publicProcedure
    .input(
      z.object({
        useCaseName: z
          .string()
          .min(1)
          .refine((data) => data.length > 0, {
            message: "useCaseName should have at least 1 character",
          }),
        useCaseDescription: z.string().refine((data) => data.length > 0, {
          message: "useCaseDescription should not be empty",
        }),
        tags: z.array(z.string()).refine((data) => data.length > 0, {
          message: "tags should not be empty",
        }),
        analysisTypes: z
          .array(z.string())
          .refine((data) => data.length > 0, {
            message:
              "analysisTypes should not be empty",
        }),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO fix endpoint
      const sqs = new AWS.SQS({
        endpoint: "http://sqs.us-east-1.localhost.localstack.cloud:4566/",
        region: "us-east-1",
      });
      console.log("\nSQS Config:\n", sqs);

      const requestID = shortUid();
      console.log("\nRequestID:\n", requestID);
      const message = { requestID: requestID, ...input };

      const queueUrlResponse = await sqs
        .getQueueUrl({ QueueName: QUEUE_NAME })
        .promise();
      const queueUrl = queueUrlResponse.QueueUrl;

      if (!queueUrl) {
        throw new Error("Failed to get the SQS queue URL");
      }

      let sqsParams = {
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl,
      };

      await sqs.sendMessage(sqsParams).promise();

      // TODO fix endpoint
      const dynamodb = new AWS.DynamoDB({
        endpoint: "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/",
        region: "us-east-1",
      });
      console.log("\nDynamoDB Config:\n", dynamodb);

      // set status in DynamoDB to QUEUED
      const status = "QUEUED";
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
          useCaseStatus: {
            S: status,
          },
          useCaseName: {
            S: input.useCaseName,
          },
          useCaseDescription: {
            S: input.useCaseDescription,
          },
          author: {
            // S: input.author, // TODO do we have author name yet?
            S: "Test Author",
          },
          analysisTypes: {
            L: input.analysisTypes.map((type) => ({
              S: type, // TODO check
            })),
          },
          tags: {
            L: input.tags.map((tag) => ({
              S: tag,
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
