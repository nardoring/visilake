import { DynamoArray } from "./dynamoArray";
import { DynamoNumber } from "./dynamoNumber";
import { DynamoString } from "./dynamoString";

export interface UseCase {
  useCaseName: DynamoString;
  creationDate: DynamoNumber;
  useCaseDescription: DynamoString;
  useCaseStatus: DynamoString;
  powerBILink: DynamoString;
  author: DynamoString;
  analysisTypes: DynamoArray<DynamoString>;
}
