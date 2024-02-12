import { createTRPCRouter, publicProcedure } from "../trpc";
import mapAnalysisTypes from "~/mappers/analysisTypeMapper";
import type { AnalysisType } from "~/models/db/analysisType";
import type { DynamoScan } from "~/models/db/dynamoScan";
import getDynamoDBClient from "~/clients/dynamodb";

const DYNAMODB_TABLE = "analysisTypes";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    const dynamodb = getDynamoDBClient();

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
