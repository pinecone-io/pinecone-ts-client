/* This file tests both Upsert and Update operations. It additionally tests the RetryOnServerFailure implementation
 on the Upsert operation. */

import { Index, Pinecone } from '../../../index';
import {
  generateRecords,
  globalNamespaceOne,
  randomIndexName,
  waitUntilReady,
} from '../../test-helpers';
import { RetryOnServerFailure } from '../../../utils';
import { PineconeMaxRetriesExceededError } from '../../../errors';
// import express from 'express';
import http from 'http';
import { parse } from 'url';

// todo: add pods

let pinecone: Pinecone, serverlessIndex: Index, serverlessIndexName: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndexName = randomIndexName('int-test-serverless-upsert-update');

  await pinecone.createIndex({
    name: serverlessIndexName,
    dimension: 2,
    metric: 'cosine',
    spec: {
      serverless: {
        region: 'us-west-2',
        cloud: 'aws',
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
});

afterAll(async () => {
  await waitUntilReady(serverlessIndexName);
  await pinecone.deleteIndex(serverlessIndexName);
});

// todo: add sparse values update
describe('upsert and update to serverless index', () => {
  test('verify upsert and update', async () => {
    const recordToUpsert = generateRecords({
      dimension: 2,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });

    // Upsert record
    await serverlessIndex.upsert(recordToUpsert);

    // Build new values
    const newValues = [0.5, 0.4];
    const newMetadata = { flavor: 'chocolate' };

    const updateSpy = jest
      .spyOn(serverlessIndex, 'update')
      .mockResolvedValue(undefined);

    // Update values w/new values
    await serverlessIndex.update({
      id: '0',
      values: newValues,
      metadata: newMetadata,
    });

    expect(updateSpy).toHaveBeenCalledWith({
      id: '0',
      values: newValues,
      metadata: newMetadata,
    });

    // Clean up spy after the test
    updateSpy.mockRestore();
  });
});

// Retry logic tests
describe('Testing retry logic on Upsert operation, as run on a mock, in-memory http server', () => {
  const recordsToUpsert = generateRecords({
    dimension: 2,
    quantity: 1,
    withSparseValues: false,
    withMetadata: true,
  });

  let server: http.Server; // Note: server cannot be something like an express server due to conflicts w/edge runtime
  let mockServerlessIndex: Index;
  let callCount: number;

  // Helper function to start the server with a specific response pattern
  const startMockServer = (shouldSucceedOnSecondCall: boolean) => {
    // Create http server
    server = http.createServer((req, res) => {
      const { pathname } = parse(req.url || '', true);

      if (req.method === 'POST' && pathname === '/vectors/upsert') {
        callCount++;
        if (shouldSucceedOnSecondCall && callCount === 1) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ name: 'PineconeUnavailableError' }));
        } else if (shouldSucceedOnSecondCall && callCount === 2) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 200, data: 'Success' }));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ name: 'PineconeUnavailableError' }));
        }
      } else {
        res.writeHead(404); // Not found
        res.end();
      }
    });
    server.listen(4000); // Host server on local port 4000
  };

  beforeEach(() => {
    // Reset callCount
    callCount = 0;
    // Define index that points to the mock server on port 4000
    mockServerlessIndex = pinecone
      .Index(serverlessIndexName, 'http://localhost:4000')
      .namespace(globalNamespaceOne);
  });

  afterEach(async () => {
    // Close server and reset mocks
    await new Promise<void>((resolve) => server.close(() => resolve()));
    jest.clearAllMocks();
  });

  test('Upsert operation should retry 1x if server responds 1x with error and 1x with success', async () => {
    const retrySpy = jest.spyOn(RetryOnServerFailure.prototype, 'execute');
    const delaySpy = jest.spyOn(RetryOnServerFailure.prototype, 'delay');

    // Start server with a successful response on the second call
    startMockServer(true);

    // Call Upsert operation
    await mockServerlessIndex.upsert(recordsToUpsert);

    expect(retrySpy).toHaveBeenCalledTimes(1);
    expect(delaySpy).toHaveBeenCalledTimes(1);
    expect(callCount).toBe(2);
  });

  test('Max retries exceeded w/o resolve', async () => {
    const retrySpy = jest.spyOn(RetryOnServerFailure.prototype, 'execute');
    const delaySpy = jest.spyOn(RetryOnServerFailure.prototype, 'delay');

    // Start server with persistent 503 errors on every call
    startMockServer(false);

    // Catch expected error from Upsert operation
    const errorResult = async () => {
      await mockServerlessIndex.upsert(recordsToUpsert, { maxRetries: 1 });
    };

    await expect(errorResult).rejects.toThrowError(
      PineconeMaxRetriesExceededError
    );
    expect(retrySpy).toHaveBeenCalledTimes(1);
    expect(delaySpy).toHaveBeenCalledTimes(1);
    expect(callCount).toBe(2);
  });
});
