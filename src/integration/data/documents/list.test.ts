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

describe('listDocuments, serverless index', () => {
  test('test listDocuments with no arguments', async () => {
    const listResults = await serverlessIndex.listDocuments({});
    expect(listResults).toBeDefined();
    expect(listResults.pagination).toBeUndefined(); // Only 11 documents in the index, so no pag token returned
    expect(listResults.documents.length).toBe(11);
    expect(listResults.namespace).toBe(globalNamespaceOne);
  });

  test('test listDocuments with prefix', async () => {
    const listResults = await serverlessIndex.listDocuments({
      prefix: diffPrefix,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.documents.length).toBe(1);
    expect(listResults.pagination).toBeUndefined();
  });

  test('test listDocuments with limit and pagination', async () => {
    const listResults = await serverlessIndex.listDocuments({
      prefix,
      limit: 3,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.documents.length).toBe(3);
    expect(listResults.pagination).toBeDefined();

    const listResultsPg2 = await serverlessIndex.listDocuments({
      prefix,
      limit: 5,
      paginationToken: listResults.pagination?.next,
    });

    expect(listResultsPg2.namespace).toBe(globalNamespaceOne);
    expect(listResultsPg2.documents.length).toBe(5);
  });
});
