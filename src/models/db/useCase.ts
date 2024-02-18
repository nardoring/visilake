import type { DynamoArray } from './dynamoArray';
import type { DynamoNumber } from './dynamoNumber';
import type { DynamoString } from './dynamoString';

export interface UseCase {
  useCaseName: DynamoString;
  creationDate: DynamoNumber;
  useCaseDescription: DynamoString;
  useCaseStatus: DynamoString;
  powerBILink: DynamoString;
  author: DynamoString;
  analysisTypes: DynamoArray<DynamoString>;
}
