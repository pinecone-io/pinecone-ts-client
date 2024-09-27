import { Pinecone, Index } from '../../index';
import {
  randomString,
  generateRecords,
  waitUntilRecordsReady,
  assertWithRetries,
  serverlessIndexName,
  podIndexName,
} from '../test-helpers';

let pinecone: Pinecone,
  serverlessIndex: Index,
  serverlessNamespace: Index,
  serverlessNamespaceName: string,
  podIndex: Index,
  podNamespace: Index,
  podNamespaceName: string,
  recordIds: string[],
  numberOfRecords: number;

beforeAll(async () => {
  pinecone = new Pinecone();

  serverlessIndex = pinecone.index(serverlessIndexName);
  serverlessNamespaceName = randomString(16);
  serverlessNamespace = serverlessIndex.namespace(serverlessNamespaceName);

  podIndex = pinecone.index(podIndexName);
  podNamespaceName = randomString(16);
  podNamespace = podIndex.namespace(podNamespaceName);

  numberOfRecords = 3;

  // Seed with records for testing
  const recordsToUpsert = generateRecords({
    dimension: 2, // Must match dims of global integration test indexes defined in setup.ts
    quantity: numberOfRecords,
    withSparseValues: true,
  });
  expect(recordsToUpsert).toHaveLength(3);
  expect(recordsToUpsert[0].id).toEqual('0');
  expect(recordsToUpsert[1].id).toEqual('1');
  expect(recordsToUpsert[2].id).toEqual('2');

  await serverlessNamespace.upsert(recordsToUpsert);
  await podNamespace.upsert(recordsToUpsert);

  recordIds = recordsToUpsert.map((r) => r.id);
  await waitUntilRecordsReady(
    serverlessNamespace,
    serverlessNamespaceName,
    recordIds
  );
  await waitUntilRecordsReady(podNamespace, podNamespaceName, recordIds);
});

afterAll(async () => {
  await serverlessNamespace.deleteMany(recordIds);
  await podNamespace.deleteMany(recordIds);
});

// todo: add tests for pod index
describe('query tests on serverless index', () => {
  test('query by id', async () => {
    const topK = 1;
    const queryId = recordIds[0];
    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      expect(results.usage.readUnits).toBeDefined();
      expect(results.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: queryId })])
      );
    };

    await assertWithRetries(
      () => serverlessNamespace.query({ id: queryId, topK }),
      assertions
    );
  });

  test('query when topK is greater than number of records', async () => {
    const topK = numberOfRecords + 2;
    const queryId = recordIds[1];
    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(numberOfRecords);
      expect(results.usage.readUnits).toBeDefined();
    };

    await assertWithRetries(
      () => serverlessNamespace.query({ id: queryId, topK }),
      assertions
    );
  });

  test('with invalid id, returns empty results', async () => {
    const topK = 2;
    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(0);
    };

    await assertWithRetries(
      () => serverlessNamespace.query({ id: '12354523423', topK }),
      assertions
    );
  });

  test('query with vector and sparseVector values', async () => {
    const topK = 1;
    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      expect(results.usage.readUnits).toBeDefined();
    };

    await assertWithRetries(
      () =>
        serverlessNamespace.query({
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

    const assertions = (results) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(2);
      expect(results.usage.readUnits).toBeDefined();
    };

    await assertWithRetries(
      () =>
        serverlessNamespace.query({
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
