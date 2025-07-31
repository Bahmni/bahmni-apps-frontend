import { get, post, put, del } from '@bahmni-frontend/bahmni-services';
import React, { useState } from 'react';

export const ApiTest: React.FC = () => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleApiCall = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    setLoading(true);
    setResponse('');

    try {
      let result;
      const baseUrl = 'https://jsonplaceholder.typicode.com';

      switch (method) {
        case 'GET':
          result = await get(`${baseUrl}/posts/1`);
          break;
        case 'POST':
          result = await post(`${baseUrl}/posts`, {
            title: 'Test Post',
            body: 'Test Body',
            userId: 1,
          });
          break;
        case 'PUT':
          result = await put(`${baseUrl}/posts/1`, {
            id: 1,
            title: 'Updated Post',
            body: 'Updated Body',
            userId: 1,
          });
          break;
        case 'DELETE':
          result = await del(`${baseUrl}/posts/1`);
          break;
      }

      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setResponse(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '20px',
        margin: '10px',
        borderRadius: '8px',
      }}
    >
      <h2>API Service Test</h2>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={() => handleApiCall('GET')}
          disabled={loading}
          style={{ margin: '5px', padding: '8px 16px' }}
        >
          GET Data
        </button>
        <button
          onClick={() => handleApiCall('POST')}
          disabled={loading}
          style={{ margin: '5px', padding: '8px 16px' }}
        >
          POST Data
        </button>
        <button
          onClick={() => handleApiCall('PUT')}
          disabled={loading}
          style={{ margin: '5px', padding: '8px 16px' }}
        >
          PUT Data
        </button>
        <button
          onClick={() => handleApiCall('DELETE')}
          disabled={loading}
          style={{ margin: '5px', padding: '8px 16px' }}
        >
          DELETE Data
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Response:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '300px',
          }}
        >
          {loading ? 'Loading...' : response || 'No response yet'}
        </pre>
      </div>
    </div>
  );
};
