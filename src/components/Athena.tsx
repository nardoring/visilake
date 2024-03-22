import React from 'react';
import { api } from '~/utils/api';

function AthenaQueryComponent() {
  const { data, isLoading, error } = api.athena.executeQuery.useQuery({
    query: 'SHOW DATABASES',
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
