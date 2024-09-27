import { Pinecone, Index } from '../../index';
import {
  generateRecords,
  randomString,
  serverlessIndexName,
  waitUntilRecordsReady,
} from '../test-helpers';

let pinecone: Pinecone,
  serverlessIndex: Index,
  serverlessNamespace: Index,
  serverlessNamespaceName: string,
  prefix: string;

const recordIds: string[] = [];

beforeAll(async () => {
  pinecone = new Pinecone();

  serverlessNamespaceName = randomString(16);
  serverlessIndex = pinecone.index(serverlessIndexName);
  serverlessNamespace = serverlessIndex.namespace(serverlessNamespaceName);
  prefix = 'preTest';

  // Seed the namespace with records for testing
  const recordsToUpsert = generateRecords({
    dimension: 2,
    quantity: 120,
    prefix,
  });
  const upsertedIds = recordsToUpsert.map((r) => r.id);

  await serverlessNamespace.upsert(recordsToUpsert);
  await waitUntilRecordsReady(
    serverlessNamespace,
    serverlessNamespaceName,
    upsertedIds
  );
  recordIds.concat(upsertedIds);
});

afterAll(async () => {
  await serverlessNamespace.deleteAll();
});

describe('listPaginated, serverless index', () => {
  test('test listPaginated with no arguments', async () => {
    const listResults = await serverlessIndex.listPaginated();
    expect(listResults).toBeDefined();
    expect(listResults.pagination).not.toBeDefined();
    expect(listResults.vectors?.length).toBe(0);
    expect(listResults.namespace).toBe('');
  });

  test('test listPaginated with prefix', async () => {
    const listResults = await serverlessNamespace.listPaginated({ prefix });
    expect(listResults.namespace).toBe(serverlessNamespaceName);
    expect(listResults.vectors?.length).toBe(100);
    expect(listResults.pagination?.next).toBeDefined();
  });

  test('test listPaginated with limit and pagination', async () => {
    const listResults = await serverlessNamespace.listPaginated({
      prefix,
      limit: 60,
    });
    expect(listResults.namespace).toBe(serverlessNamespaceName);
    expect(listResults.vectors?.length).toBe(60);
    expect(listResults.pagination?.next).toBeDefined();

    const listResultsPg2 = await serverlessNamespace.listPaginated({
      prefix,
      limit: 60,
      paginationToken: listResults.pagination?.next,
    });

    expect(listResultsPg2.namespace).toBe(serverlessNamespaceName);
    expect(listResultsPg2.vectors?.length).toBe(60);
  });
});
