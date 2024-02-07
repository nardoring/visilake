import AWS from "aws-sdk";
import { createTRPCRouter, publicProcedure } from "../trpc";
import mapAnalysisTypes from "~/mappers/analysisTypeMapper";
import type { AnalysisType } from "~/models/db/analysisType";
import { DynamoScan } from "~/models/db/dynamoScan";

const DYNAMODB_TABLE = "analysisTypes";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    // TODO fix endpoint
    const dynamodb = new AWS.DynamoDB({
      endpoint: "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/",
      region: "us-east-1",
    });

    const result = (await dynamodb
      .scan({
        TableName: DYNAMODB_TABLE,
      })
      .promise()) as unknown as DynamoScan<AnalysisType>;

    return {
      types: mapAnalysisTypes(result.Items),
    };
  }),
});
