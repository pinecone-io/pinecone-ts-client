import { Index, Pinecone } from '../../../index';
import { generateRecords, globalNamespaceOne, randomIndexName, waitUntilReady } from '../../test-helpers';
import { UpsertCommand } from '../../../data/vectors/upsert';
import nock from 'nock';
import { RetryOnServerFailure, RetryOptions } from '../../../utils/retries';
import { PineconeInternalServerError } from '../../../errors';
import express from 'express';
import http from 'http';


// todo: add pods

let pinecone: Pinecone, serverlessIndex: Index, serverlessIndexName: string;
let server: http.Server;
let callCount = 0; // Track the number of requests made to this endpoint


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
        cloud: 'aws'
      }
    },
    waitUntilReady: true,
    suppressConflicts: true
  });

  // Spin up an in-memory Express server to mock Pinecone API behavior
  const app = express();
  app.use(express.json());
  app.post('/vectors/upsert', (req, res) => {
    callCount++;
    if (callCount === 1) {
      res.status(503).json({ name: 'PineconeUnavailableError' });
    } else {
      res.status(200).json({ status: 200, data: 'Success' });
    }
  });

  server = app.listen(4000, () => {
    console.log('Mock Pinecone server running on http://localhost:4000');
  });


  serverlessIndex = pinecone
    .index(serverlessIndexName, "http://localhost:4000")
    .namespace(globalNamespaceOne);
});

afterAll(async () => {
  await waitUntilReady(serverlessIndexName);
  await pinecone.deleteIndex(serverlessIndexName);
  server.close();
});

// todo: add sparse values update
// describe('upsert and update to serverless index', () => {
//   test('verify upsert and update', async () => {
//     const recordToUpsert = generateRecords({
//       dimension: 2,
//       quantity: 1,
//       withSparseValues: false,
//       withMetadata: true
//     });
//
//     // Upsert record
//     await serverlessIndex.upsert(recordToUpsert);
//
//     // Build new values
//     const newValues = [0.5, 0.4];
//     const newMetadata = { flavor: 'chocolate' };
//
//     const updateSpy = jest
//       .spyOn(serverlessIndex, 'update')
//       .mockResolvedValue(undefined);
//
//     // Update values w/new values
//     await serverlessIndex.update({
//       id: '0',
//       values: newValues,
//       metadata: newMetadata
//     });
//
//     expect(updateSpy).toHaveBeenCalledWith({
//       id: '0',
//       values: newValues,
//       metadata: newMetadata
//     });
//
//     // Clean up spy after the test
//     updateSpy.mockRestore();
//   });
// });

// New test with mocked HTTP using nock
describe('Mocked upsert with retry logic', () => {
  test('should retry once on server error and succeed', async () => {
    const recordsToUpsert = generateRecords({
      dimension: 2,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });

    // Spy on the retry-related methods
    const retrySpy = jest.spyOn(RetryOnServerFailure.prototype, 'execute');
    const delaySpy = jest.spyOn(RetryOnServerFailure.prototype, 'delay');

    // Run the upsert method, which should retry once
    await serverlessIndex.upsert(recordsToUpsert);

    // Verify that the retry mechanism was triggered
    expect(retrySpy).toHaveBeenCalledTimes(1); // `execute` is only called once
    expect(delaySpy).toHaveBeenCalledTimes(1); // One delay for one retry

    // Verify the mock server behavior
    expect(callCount).toBe(2);
  });
});
