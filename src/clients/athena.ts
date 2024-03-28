import { AthenaClient } from '@aws-sdk/client-athena';

function getAthenaClient() {
  const athena = new AthenaClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.ATHENA_URL,
  });
  console.log('\nAthena Config:\n', athena);
  console.log('\nAthena Endpoint:\n', process.env.ATHENA_URL);

  return athena;
}

export default getAthenaClient;
