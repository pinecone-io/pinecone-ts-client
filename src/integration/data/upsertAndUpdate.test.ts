import { Pinecone, Index } from '../../index';
import {
  assertWithRetries,
  randomString,
  generateRecords,
  serverlessIndexName,
  waitUntilRecordsReady,
} from '../test-helpers';

// todo: split this out into upsert and update; can upsert once in global index

let pinecone: Pinecone,
  // todo: add pods
  serverlessIndex: Index,
  serverlessNamespace: Index,
  serverlessNamespaceName: string,
  recordIds: string[];

beforeAll(async () => {
  // todo: add pods
  pinecone = new Pinecone();
  serverlessNamespaceName = randomString(16);
  serverlessIndex = pinecone.index(serverlessIndexName);
  serverlessNamespace = serverlessIndex.namespace(serverlessNamespaceName);
});

afterAll(async () => {
  await serverlessNamespace.deleteMany(recordIds);
  // todo: add pods
});

describe('upsert and update to serverless index', () => {
  test('verify upsert and update', async () => {
    const recordToUpsert = generateRecords({
      dimension: 2,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });
    recordIds = recordToUpsert.map((r) => r.id);
    const oldMetadata = recordToUpsert['0'].metadata;
    expect(recordToUpsert).toHaveLength(1);
    expect(recordToUpsert[0].id).toEqual('0');

    await serverlessNamespace.upsert(recordToUpsert);
    await waitUntilRecordsReady(
      serverlessNamespace,
      serverlessNamespaceName,
      recordIds
    );

    // Fetch and inspect records to validate upsert
    const preUpdateAssertions = (response) => {
      expect(response.records['0']).toBeDefined();
      expect(response.records['0'].values).toEqual(recordToUpsert[0].values);
      expect(response.records['0'].metadata).toEqual(
        recordToUpsert[0].metadata
      );
    };

    await assertWithRetries(
      () => serverlessNamespace.fetch(recordIds),
      preUpdateAssertions
    );

    // Update record values
    const newValues = [0.5, 0.4];
    const newMetadata = { flavor: 'chocolate' };
    await serverlessNamespace.update({
      id: '0',
      values: newValues,
      metadata: newMetadata,
    });

    const postUpdateAssertions = (response) => {
      expect(response.records['0'].values).toEqual(newValues);
      expect(response.records['0'].metadata).toEqual({
        ...oldMetadata,
        ...newMetadata,
      });
    };

    await assertWithRetries(
      () => serverlessNamespace.fetch(['0']),
      postUpdateAssertions
    );
  });
});
