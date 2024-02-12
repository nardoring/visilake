import AWS from "aws-sdk";

function getDynamoDBClient() {
  const dynamodb = new AWS.DynamoDB({
    endpoint: process.env.DYNAMO_URL,
    region: process.env.AWS_REGION,
  });

  return dynamodb;
}

export default getDynamoDBClient;
