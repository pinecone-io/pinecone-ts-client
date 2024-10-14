
import { Pinecone, Index } from '../../../index';
import {
  diffPrefix,
  globalNamespaceOne, prefix,
} from '../../test-helpers';

let pinecone: Pinecone, serverlessIndex: Index;

beforeAll(async () => {
  pinecone = new Pinecone();
  if (!process.env.SERVERLESS_INDEX_NAME) {
    throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
  }
  const serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;
  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
});

describe('listPaginated, serverless index', () => {
  test('test listPaginated with no arguments', async () => {
    const listResults = await serverlessIndex.listPaginated();
    expect(listResults).toBeDefined();
    // expect(listResults.pagination).toBeDefined(); todo: re-enable this once pagination bug is fixed (https://app.asana.com/0/1204819992273155/1207992392793971/f)
    expect(listResults.vectors?.length).toBe(11);
    expect(listResults.namespace).toBe(globalNamespaceOne);
  });

  test('test listPaginated with prefix', async () => {
    const listResults = await serverlessIndex.listPaginated({
      prefix: diffPrefix,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.vectors?.length).toBe(1);
    // expect(listResults.pagination).toBeDefined(); todo: re-enable this once pagination bug is fixed (https://app.asana.com/0/1204819992273155/1207992392793971/f)
  });

  test('test listPaginated with limit and pagination', async () => {
    const listResults = await serverlessIndex.listPaginated({
      prefix,
      limit: 3,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.vectors?.length).toBe(3);
    // expect(listResults.pagination).toBeDefined(); todo: re-enable this once pagination bug is fixed (https://app.asana.com/0/1204819992273155/1207992392793971/f)

    const listResultsPg2 = await serverlessIndex.listPaginated({
      prefix,
      limit: 5,
      paginationToken: listResults.pagination?.next,
    });

    expect(listResultsPg2.namespace).toBe(globalNamespaceOne);
    expect(listResultsPg2.vectors?.length).toBe(5);
  });
});
