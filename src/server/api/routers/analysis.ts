import AWS from "aws-sdk";
import { createTRPCRouter, publicProcedure } from "../trpc";
import mapAnalysisTypes from "~/mappers/analysisTypeMapper";
import type { AnalysisType } from "~/models/db/analysisType";

const DYNAMODB_TABLE = "analysisTypes";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    // TODO fix endpoint
    const dynamodb = new AWS.DynamoDB({
      endpoint: "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/",
      region: "us-east-1",
    });

    return {
      types: mapAnalysisTypes(
        (await dynamodb
          .scan({
            TableName: DYNAMODB_TABLE,
          })
          .promise()) as unknown as AnalysisType[],
      ),
    };
  }),
});
