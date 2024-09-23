import { Pinecone, Index } from '../../../index';
import {
  assertWithRetries,
  randomString,
  generateRecords,
  INDEX_NAME,
  waitUntilRecordsReady,
} from '../../test-helpers';

describe('upsert and update', () => {
  let pinecone: Pinecone,
    index: Index,
    ns: Index,
    namespace: string,
    recordIds: string[];

  beforeEach(async () => {
    pinecone = new Pinecone();

    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 5,
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

    namespace = randomString(16);
    index = pinecone.index(INDEX_NAME);
    ns = index.namespace(namespace);
  });

  afterEach(async () => {
    await ns.deleteMany(recordIds);
  });

  test('verify upsert and update', async () => {
    const recordToUpsert = generateRecords({
      dimension: 5,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });
    recordIds = recordToUpsert.map((r) => r.id);
    const oldMetadata = recordToUpsert['0'].metadata;
    expect(recordToUpsert).toHaveLength(1);
    expect(recordToUpsert[0].id).toEqual('0');

    await ns.upsert(recordToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);

    // Fetch and inspect records to validate upsert
    const preUpdateAssertions = (response) => {
      expect(response.records['0']).toBeDefined();
      expect(response.records['0'].values).toEqual(recordToUpsert[0].values);
      expect(response.records['0'].metadata).toEqual(
        recordToUpsert[0].metadata
      );
    };

    await assertWithRetries(() => ns.fetch(recordIds), preUpdateAssertions);

    // Update record values
    const newValues = [0.5, 0.4, 0.3, 0.2, 0.1];
    const newMetadata = { flavor: 'chocolate' };
    await ns.update({
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

    await assertWithRetries(() => ns.fetch(['0']), postUpdateAssertions);
  });
});
