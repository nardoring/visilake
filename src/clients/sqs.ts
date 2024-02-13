import AWS from "aws-sdk";

function getSQSClient() {
  const sqs = new AWS.SQS({
    endpoint: process.env.SQS_URL,
    region: process.env.AWS_REGION,
  });
  console.log("\nSQS Config:\n", sqs);

  return sqs;
}

export default getSQSClient;
