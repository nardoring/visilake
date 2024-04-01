import React, { useState } from 'react';
import { api } from '~/utils/api';

function AthenaQueryComponent() {
  const [query, setQuery] = useState('SELECT * FROM mockdata.dataset1 LIMIT 2');
  const executeQueryMutation = api.athena.executeQuery.useMutation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeQueryMutation.mutate({ query });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          SQL Query:
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '60%', margin: '10px' }}
          />
        </label>
        <button type='submit'>Run Query</button>
      </form>

      {executeQueryMutation.isLoading && <div>Querying...</div>}
      {executeQueryMutation.error && (
        <div>Error: {executeQueryMutation.error.message}</div>
      )}
      {executeQueryMutation.data && (
        <div>
          Athena Query Results:
          <pre>{JSON.stringify(executeQueryMutation.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default AthenaQueryComponent;
