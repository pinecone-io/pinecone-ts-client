import { Index, Pinecone } from '../index';
import { generateRecords, globalNamespaceOne, sleep } from './test-helpers';
import { PineconeMaxRetriesExceededError } from '../errors';
import http from 'http';
import { parse } from 'url';

// Retry logic tests
describe('Testing retry logic via a mock, in-memory http server', () => {
  const recordsToUpsert = generateRecords({
    dimension: 2,
    quantity: 1,
    withSparseValues: false,
    withMetadata: true,
  });

  let pinecone: Pinecone;
  const indexName = 'local-test-index';

  let server: http.Server; // Note: server cannot be something like an express server due to conflicts w/edge runtime
  let mockServerlessIndex: Index;
  let callCount: number;
  let op: string;

  // Helper function to start the server with a specific response pattern
  const startMockServer = (shouldSucceedOnSecondCall: boolean) => {
    // Create http server
    server = http.createServer((req, res) => {
      const { pathname } = parse(req.url || '', true);
      if (req.method === 'POST' && pathname === `/vectors/${op}`) {
        callCount++;
        if (shouldSucceedOnSecondCall && callCount === 1) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ name: 'PineconeUnavailableError', status: 503 })
          );
        } else if (shouldSucceedOnSecondCall && callCount === 2) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 200, data: 'Success' }));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ name: 'PineconeUnavailableError', status: 503 })
          );
        }
      } else {
        res.writeHead(404); // Not found
        res.end();
      }
    });
    server.listen(4000); // Host server on local port 4000
  };

  beforeAll(() => {
    pinecone = new Pinecone();
  });

  beforeEach(() => {
    callCount = 0;
  });

  afterEach(async () => {
    // Close server and reset mocks
    await new Promise<void>((resolve) => server.close(() => resolve()));
    jest.clearAllMocks();
  });

  test('Upsert operation should retry 1x if server responds 1x with error and 1x with success', async () => {
    op = 'upsert';
    pinecone = new Pinecone({
      apiKey: process.env['PINECONE_API_KEY'] || '',
      maxRetries: 2,
    });

    mockServerlessIndex = pinecone.Index({
      name: indexName,
      host: 'http://localhost:4000',
      namespace: globalNamespaceOne,
    });

    // Start server with a successful response on the second call
    startMockServer(true);

    // Call Upsert operation
    await mockServerlessIndex.upsert(recordsToUpsert);

    // 2 total tries: 1 initial call, 1 retry
    expect(callCount).toBe(2);
  });

  test('Update operation should retry 1x if server responds 1x with error and 1x with success', async () => {
    op = 'update';

    pinecone = new Pinecone({
      apiKey: process.env['PINECONE_API_KEY'] || '',
      maxRetries: 2,
    });

    mockServerlessIndex = pinecone.Index({
      name: indexName,
      host: 'http://localhost:4000',
      namespace: globalNamespaceOne,
    });

    // Start server with a successful response on the second call
    startMockServer(true);

    const recordIdToUpdate = recordsToUpsert[0].id;
    const newMetadata = { flavor: 'chocolate' };

    // Call Update operation
    await mockServerlessIndex.update({
      id: recordIdToUpdate,
      metadata: newMetadata,
    });

    // 2 total tries: 1 initial call, 1 retry
    expect(callCount).toBe(2);
  });

  test('Max retries exceeded w/o resolve', async () => {
    op = 'upsert';

    await sleep(500); // In Node20+, tcp connections changed: https://github.com/pinecone-io/pinecone-ts-client/pull/318#issuecomment-2560180936

    pinecone = new Pinecone({
      apiKey: process.env['PINECONE_API_KEY'] || '',
      maxRetries: 3,
    });

    mockServerlessIndex = pinecone.Index({
      name: indexName,
      host: 'http://localhost:4000',
      namespace: globalNamespaceOne,
    });

    // Start server with persistent 503 errors on every call
    startMockServer(false);

    // Catch expected error from Upsert operation
    await expect(
      mockServerlessIndex.upsert(recordsToUpsert)
    ).rejects.toThrowError(PineconeMaxRetriesExceededError);

    // 4 total tries: 1 initial call + 3 retries
    expect(callCount).toBe(4);
  });
});
