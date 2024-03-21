import { AthenaClient } from '@aws-sdk/client-athena';

function getAthenaClient() {
  const athena = new AthenaClient({
    region: process.env.AWS_REGION,
  });
  console.log('\nAthena Config:\n', athena);

  return athena;
}

export default getAthenaClient;
