import type { DynamoArray } from './dynamoArray';
import type { DynamoNumber } from './dynamoNumber';
import type { DynamoString } from './dynamoString';

export interface Job {
  jobName: DynamoString;
  creationDate: DynamoNumber;
  jobDescription: DynamoString;
  jobStatus: DynamoString;
  powerBILink: DynamoString;
  author: DynamoString;
  analysisTypes: DynamoArray<DynamoString>;
  sources: DynamoArray<DynamoString>;
  requestID: DynamoString;
  dateRangeStart: DynamoNumber;
  dateRangeEnd: DynamoNumber;
  granularity: DynamoNumber;
}
