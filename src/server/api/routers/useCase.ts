/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { UseCase } from "~/models/useCase";
// import AWS from "aws-sdk";

const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const LOCALSTACK_HOSTNAME = process.env.LOCALSTACK_HOSTNAME;
const ENDPOINT = `http://localhost:4566`;
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_DEFAULT_REGION = "us-east-1";

const QUEUE_NAME = 'requestQueue';
const CLIENT_CONFIG = LOCALSTACK_HOSTNAME ? {endpoint: ENDPOINT} : {};

const connectSQS = () => new AWS.SQS(CLIENT_CONFIG);
const connectDynamoDB = () => new AWS.DynamoDB(CLIENT_CONFIG);
const shortUid = () => uuidv4().substring(0, 8);

export const useCaseRouter = createTRPCRouter({
  getUseCases: publicProcedure
    .input(
      z.object({
        minId: z.number().positive(),
        maxAmount: z.number().positive(),
      }),
    )
    .query(({}) => {
      let mockResponse: UseCase[] = [
        {
          useCaseName: "Use case 1",
          date: new Date("2023-11-06T03:21:19+00:00"),
          useCaseDescription: "This is a test",
          useCaseStatus: "Complete",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value'",
          author: "James Smith",
          analysisTypes: ["Trend Analysis", "Predictive Modeling"],
        },
        {
          useCaseName: "Use case 2",
          date: new Date("2023-11-07T04:22:20+00:00"),
          useCaseDescription: "This is the second test",
          useCaseStatus: "InProgress",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value2'",
          author: "Maria Garcia",
          analysisTypes: ["Data Mining", "Text Analytics"],
        },
        // ... other use cases updated similarly
        {
          useCaseName: "Use case 5",
          date: new Date("2023-11-10T07:25:23+00:00"),
          useCaseDescription: "Fifth use case scenario",
          useCaseStatus: "InProgress",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value5'",
          author: "David Johnson",
          analysisTypes: ["Sentiment Analysis", "Risk Assessment"],
        },
      ];

      return mockResponse;
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
        analysisTypeIds: z
          .array(z.number().positive())
          .refine((data) => data.length > 0, {
            message:
              "analysisTypeIds should not be empty and should only contain positive numbers",
          }),
      }),
    )
    .mutation( async ({ input }) => {
      // TODO:
      // const sqs = connectSQS();
      const sqs = new AWS.SQS({
        // endpoint: "http://localhost:4566/000000000000/requestQueue",
        endpoint: "http://sqs.us-east-1.localhost.localstack.cloud:4566/",
        region: "us-east-1",
      });
      console.log("SQS Config:\n", sqs);

      const requestID = shortUid();
      console.log("RequestID:\n", requestID);

      const message = {'requestID': requestID};
      const queueUrl = (await sqs.getQueueUrl({QueueName: QUEUE_NAME}).promise()).QueueUrl;

      let params = {
          MessageBody: JSON.stringify(message),
          QueueUrl: queueUrl
      };
      await sqs.sendMessage(params).promise();

    }),
});
