import { Pinecone, Index } from '../../index';
import {
  generateRecords,
  randomString,
  INDEX_NAME,
  waitUntilRecordsReady,
} from '../testHelpers';

describe('list', () => {
  let pinecone: Pinecone,
    index: Index,
    ns: Index,
    namespace: string,
    prefix: string;

  const recordIds: string[] = [];

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
    prefix = 'preTest';

    // Seed the namespace with records for testing
    const recordsToUpsert = generateRecords({
      dimension: 5,
      quantity: 120,
      prefix,
    });
    const upsertedIds = recordsToUpsert.map((r) => r.id);

    await ns.upsert(recordsToUpsert);
    await waitUntilRecordsReady(ns, namespace, upsertedIds);
    recordIds.concat(upsertedIds);
  });

  afterAll(async () => {
    await ns.deleteAll();
  });

  describe('listPaginated', () => {
    test('test listPaginated with no arguments', async () => {
      const listResults = await index.listPaginated();
      expect(listResults).toBeDefined();
      expect(listResults.pagination).not.toBeDefined();
      expect(listResults.vectors?.length).toBe(0);
      expect(listResults.namespace).toBe('');
    });

    test('test listPaginated with prefix', async () => {
      const listResults = await ns.listPaginated({ prefix });
      expect(listResults.namespace).toBe(namespace);
      expect(listResults.vectors?.length).toBe(100);
      expect(listResults.pagination?.next).toBeDefined();
    });

    test('test listPaginated with limit and pagination', async () => {
      const listResults = await ns.listPaginated({ prefix, limit: 60 });
      expect(listResults.namespace).toBe(namespace);
      expect(listResults.vectors?.length).toBe(60);
      expect(listResults.pagination?.next).toBeDefined();

      const listResultsPg2 = await ns.listPaginated({
        prefix,
        limit: 60,
        paginationToken: listResults.pagination?.next,
      });

      expect(listResultsPg2.namespace).toBe(namespace);
      expect(listResultsPg2.vectors?.length).toBe(60);
    });
  });
});
