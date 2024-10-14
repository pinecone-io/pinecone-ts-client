import { Pinecone, Index } from '../../../index';
import {
  randomString,
  generateRecords,
  INDEX_NAME,
  waitUntilRecordsReady,
  assertWithRetries,
} from '../../test-helpers';

describe('query', () => {
  let pinecone: Pinecone,
    index: Index,
    ns: Index,
    namespace: string,
    recordIds: string[],
    numberOfRecords: number;

  beforeAll(async () => {
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
    numberOfRecords = 3;

    // Seed with records for testing
    const recordsToUpsert = generateRecords({
      dimension: 5,
      quantity: numberOfRecords,
      withSparseValues: true,
    });
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);
    recordIds = recordsToUpsert.map((r) => r.id);
    await waitUntilRecordsReady(ns, namespace, recordIds);
  });

  afterAll(async () => {
    await ns.deleteMany(recordIds);
  });

  test('query by id', async () => {
    const topK = 2;
    const queryId = recordIds[0];
    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      expect(results.usage.readUnits).toBeDefined();
      expect(results.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: queryId })])
      );
    };

    await assertWithRetries(() => ns.query({ id: queryId, topK }), assertions);
  });

  test('query when topK is greater than number of records', async () => {
    const topK = numberOfRecords + 2;
    const queryId = recordIds[1];
    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(numberOfRecords);
      expect(results.usage.readUnits).toBeDefined();
    };

    await assertWithRetries(() => ns.query({ id: queryId, topK }), assertions);
  });

  test('with invalid id, returns empty results', async () => {
    const topK = 2;
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(0);
    };
    await assertWithRetries(
      () => serverlessIndex.query({ id: '12354523423', topK }),
      assertions
    );
  });

  test('query with vector and sparseVector values', async () => {
    const topK = 1;
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    };

    await assertWithRetries(
      () =>
        serverlessIndex.query({
          vector: [0.11, 0.22],
          sparseVector: {
            indices: [32, 5],
            values: [0.11, 0.22],
          },
          topK,
        }),
      assertions
    );
  });

  test('query with includeValues: true', async () => {
    const queryVec = Array.from({ length: 2 }, () => Math.random());
    const sparseVec = {
      indices: [0, 1],
      values: Array.from({ length: 2 }, () => Math.random()),
    };

    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(2);
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    };

    await assertWithRetries(
      () =>
        serverlessIndex.query({
          vector: queryVec,
          sparseVector: sparseVec,
          topK: 2,
          includeValues: true,
          includeMetadata: true,
        }),
      assertions
    );
  });
});
