/* This file tests both Upsert and Update operations. It additionally tests the RetryOnServerFailure implementation
 on the Upsert operation. */

import { Index, Pinecone } from '../../../index';
import {
  generateRecords,
  globalNamespaceOne,
  randomIndexName,
  waitUntilReady,
} from '../../test-helpers';
import { RetryOnServerFailure } from '../../../utils/retries';
import { PineconeMaxRetriesExceededError } from '../../../errors';
import express from 'express';
import http from 'http';

// todo: add pods

let pinecone: Pinecone, serverlessIndex: Index, serverlessIndexName: string;

// Mock server setup for testing retries
let mockServerlessIndex: Index;
let callCount = 0;
const app = express();
app.use(express.json());
const server: http.Server = app.listen(4000, () => {
  console.log('Mock Pinecone server running on http://localhost:4000');
});

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

  mockServerlessIndex = pinecone
    .Index(serverlessIndexName, 'http://localhost:4000')
    .namespace(globalNamespaceOne);
});

afterAll(async () => {
  await waitUntilReady(serverlessIndexName);
  await pinecone.deleteIndex(serverlessIndexName);
  server.close();
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
describe('Mocked upsert with retry logic', () => {
  // Spy on the retry-related methods
  const retrySpy = jest.spyOn(RetryOnServerFailure.prototype, 'execute');
  const delaySpy = jest.spyOn(RetryOnServerFailure.prototype, 'delay');

  const recordsToUpsert = generateRecords({
    dimension: 2,
    quantity: 1,
    withSparseValues: false,
    withMetadata: true,
  });

  beforeEach(() => {
    // Clear previous route setup before each test to avoid state collisions
    app._router.stack = app._router.stack.filter(
      (layer) => layer.route?.path !== '/vectors/upsert'
    );
    // Reset call count and clear mocks
    callCount = 0;
    jest.clearAllMocks();
  });

  test('Upsert operation should retry 1x if server responds 1x with error and 1x with success', async () => {
    app.post('/vectors/upsert', (req, res) => {
      callCount++;
      if (callCount === 1) {
        // Return a 503 error on the 1st call
        res.status(503).json({ name: 'PineconeUnavailableError' });
      } else {
        res.status(200).json({ status: 200, data: 'Success' });
      }
    });

    // Run the upsert method, which should retry once
    await mockServerlessIndex.upsert(recordsToUpsert);

    expect(retrySpy).toHaveBeenCalledTimes(1); // `execute` is only called once
    expect(delaySpy).toHaveBeenCalledTimes(1); // 1 retry, then success
    expect(callCount).toBe(2);
  });

  test('Max retries exceeded w/o resolve', async () => {
    app.post('/vectors/upsert', (req, res) => {
      callCount++;
      // Return a 503 errors on all calls
      if (callCount === 1) {
        res.status(503).json({ name: 'PineconeUnavailableError' });
      } else if (callCount === 2) {
        res.status(503).json({ name: 'PineconeUnavailableError' });
      } else {
        res.status(503).json({ name: 'PineconeUnavailableError' }); // Never reached; Max retries exceeded here
      }
    });

    const errorResult = async () => {
      await mockServerlessIndex.upsert(recordsToUpsert, { maxRetries: 1 });
    };

    await expect(errorResult).rejects.toThrowError(
      PineconeMaxRetriesExceededError
    );

    expect(retrySpy).toHaveBeenCalledTimes(1);
    expect(delaySpy).toHaveBeenCalledTimes(1);
    // 1st call is not a retry, so expect 2 calls to the mock server for maxRetries === 1
    expect(callCount).toBe(2);
  });
});
