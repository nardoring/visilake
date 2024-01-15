import AWS from "aws-sdk";
import { createTRPCRouter, publicProcedure } from "../trpc";

const DYNAMODB_TABLE = "analysisTypes";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // TODO fix endpoint
    const dynamodb = new AWS.DynamoDB({
      endpoint: "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/",
      region: "us-east-1",
    });

    return dynamodb.scan({ TableName: DYNAMODB_TABLE });
  }),
});
