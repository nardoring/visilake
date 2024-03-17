import AWS from 'aws-sdk';

function getSNSClient() {
  const sns = new AWS.SNS({
    endpoint: process.env.SNS_URL,
    region: process.env.AWS_REGION,
  });
  console.log('\nSQS Config:\n', sns);

  return sns;
}

export default getSNSClient;
