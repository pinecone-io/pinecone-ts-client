import { Index, Pinecone } from '../../index';
import {
  generateRecords,
  INDEX_NAME,
  randomString,
  waitUntilRecordsReady,
} from '../testHelpers';

import { retry } from '../../utils/retry';

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
      metric: 'dotproduct',
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

    await retry(async () => {
      const results = await ns.query({ id: queryId, topK });
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
      expect(results.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: queryId })])
      );
    });
  });

  test('query when topK is greater than number of records', async () => {
    const topK = numberOfRecords + 2;
    const queryId = recordIds[1];

    await retry(async () => {
      const results = await ns.query({ id: queryId, topK });
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(numberOfRecords);
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    });
  });

  test('with invalid id, returns empty results', async () => {
    const topK = 2;

    await retry(async () => {
      const results = await ns.query({ id: '12354523423', topK });
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(0);
    });
  });

  test('query with vector and sparseVector values', async () => {
    const topK = 1;

    await retry(async () => {
      const results = await ns.query({
        vector: [0.11, 0.22, 0.33, 0.44, 0.55],
        sparseVector: {
          indices: [32, 5, 3, 2, 1],
          values: [0.11, 0.22, 0.33, 0.44, 0.55],
        },
        topK,
      });
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    });
  });

  test('query with includeValues: true', async () => {
    const queryVec = Array.from({ length: 5 }, () => Math.random());
    const sparseVec = {
      indices: [0, 1, 2, 3, 4],
      values: Array.from({ length: 5 }, () => Math.random()),
    };

    await retry(async () => {
      const results = await ns.query({
        vector: queryVec,
        sparseVector: sparseVec,
        topK: 2,
        includeValues: true,
        includeMetadata: true,
      });
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(2);
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    });
  });
});
