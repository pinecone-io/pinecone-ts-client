import { Index, Pinecone } from '../../../index';
import { generateRecords, globalNamespaceOne, randomIndexName, waitUntilReady } from '../../test-helpers';
import { UpsertCommand } from '../../../data/vectors/upsert';
import nock from 'nock';
import { RetryOnServerFailure, RetryOptions } from '../../../utils/retries';

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
        cloud: 'aws'
      }
    },
    waitUntilReady: true,
    suppressConflicts: true
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
    const desc = await pinecone.describeIndex(serverlessIndexName);
    const host = desc.host;

    nock.recorder.rec({dont_print: false });

    // const upsertScope = nock("https://" + host + "/vectors")
    //   .post('/upsert', body => true)
    //   .reply(503, { name: 'PineconeUnavailableError' })
    //   .post('/upsert', body => true)
    //   .reply(200, { status: 200, data: 'Success' });

    // call upsert once
    // automatically go into retry loop b/c default


    const upsertScope = nock(`https://${host}`)
      .post('/vectors/upsert/', body => {
        console.log('First attempt - Body:', JSON.stringify(body)); // Log the first request body
        return true;
      })
      .reply(503, { name: 'PineconeUnavailableError' }) // First request returns 503
      .post('/vectors/upsert/', body => {
        console.log('Second attempt - Body:', JSON.stringify(body)); // Log the second request body
        return true;
      })
      .reply(200, { status: 200, data: 'Success' }); // Second request returns 200


    const recordToUpsert = generateRecords({
      dimension: 2,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true
    });

    const retrySpy = jest.spyOn(RetryOnServerFailure.prototype, 'execute');
    const upsertSpy = jest.spyOn(serverlessIndex, 'upsert');

    await serverlessIndex.upsert(recordToUpsert);
    // nock.recorder.play();


    expect(retrySpy).toHaveBeenCalledTimes(1);
    expect(upsertScope.isDone()).toBe(true); // All `nock` expectations should be met

    // expect(upsertSpy).toHaveBeenCalledTimes(1);

    // nock.recorder.play();

    // Cleanup spies after the test
    // retrySpy.mockRestore();
    // upsertSpy.mockRestore();

    // Check if all `nock` expectations were met
    // if (!nock.isDone()) {
    //   console.log('Pending mocks:', nock.pendingMocks());
    // }
    // expect(nock.isDone()).toBe(true);

  });
});
