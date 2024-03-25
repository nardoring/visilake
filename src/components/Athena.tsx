import React from 'react';
import { api } from '~/utils/api';

function AthenaQueryComponent() {
  const { data, isLoading, error } = api.athena.executeQuery.useQuery({
    /* query: 'SELECT * FROM mockdata.hospital_beds LIMIT 2', // an example query */
    query: 'SELECT * FROM mockdata.air_quality LIMIT 2', // an example query
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      Athena Query Results:
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default AthenaQueryComponent;
