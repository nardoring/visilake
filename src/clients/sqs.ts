import AWS from "aws-sdk";

function getSQSClient() {
  const sqs = new AWS.SQS({
    endpoint: "http://sqs.us-east-1.localhost.localstack.cloud:4566/",
    region: "us-east-1",
  });

  return sqs;
}

export default getSQSClient;
