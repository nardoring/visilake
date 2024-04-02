import React, { useState } from 'react';
import { api } from '~/utils/api';

function AthenaQueryComponent() {
  const [baseQuery, setQuery] = useState(
    'SELECT * FROM mockdata.dataset1 LIMIT 2'
  );
  const [newTableName, setNewTableName] = useState('');
  const [newDatabaseName, setNewDatabaseName] = useState('mockdata');
  const [outputLocation, setOutputLocation] = useState('');

  const executeQueryMutation = api.athena.executeCTASQuery.useMutation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeQueryMutation.mutate({
      baseQuery,
      newTableName,
      databaseName: newDatabaseName,
      outputLocation,
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          SQL Query:
          <input
            type='text'
            value={baseQuery}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '60%', margin: '10px' }}
          />
        </label>
        <p>
          <label>
            New Table Name:
            <input
              type='text'
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              style={{ width: '60%', margin: '10px' }}
            />
          </label>
        </p>
        <p>
          <label>
            External Table Location:
            <input
              type='text'
              value={outputLocation}
              onChange={(e) => setOutputLocation(e.target.value)}
              style={{ width: '60%', margin: '10px' }}
            />
          </label>
        </p>
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
