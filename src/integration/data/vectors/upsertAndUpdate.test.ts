import { Index, Pinecone } from '../../../index';
import {
  generateRecords,
  globalNamespaceOne,
  randomIndexName,
  waitUntilReady,
} from '../../test-helpers';

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
