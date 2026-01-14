import { Pinecone, Index } from '../../../index';
import { globalNamespaceOne, prefix, diffPrefix } from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone, serverlessIndex: Index;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });
});

describe('listPaginated, serverless index', () => {
  test('test listPaginated with no arguments', async () => {
    const listResults = await serverlessIndex.listPaginated();
    expect(listResults).toBeDefined();
    expect(listResults.pagination).toBeUndefined(); // Only 11 records in the index, so no pag token returned
    expect(listResults.vectors?.length).toBe(11);
    expect(listResults.namespace).toBe(globalNamespaceOne);
  });

  test('test listPaginated with prefix', async () => {
    const listResults = await serverlessIndex.listPaginated({
      prefix: diffPrefix,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.vectors?.length).toBe(1);
    expect(listResults.pagination).toBeUndefined();
  });

  test('test listPaginated with limit and pagination', async () => {
    const listResults = await serverlessIndex.listPaginated({
      prefix,
      limit: 3,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.vectors?.length).toBe(3);
    expect(listResults.pagination).toBeDefined();

    const listResultsPg2 = await serverlessIndex.listPaginated({
      prefix,
      limit: 5,
      paginationToken: listResults.pagination?.next,
    });

    expect(listResultsPg2.namespace).toBe(globalNamespaceOne);
    expect(listResultsPg2.vectors?.length).toBe(5);
  });
});
