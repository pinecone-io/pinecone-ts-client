import { Pinecone, Index } from '../../index';
import {
  globalNamespaceOne,
  serverlessIndexName,
  recordIDs,
  prefix,
} from '../test-helpers';

let pinecone: Pinecone, serverlessIndex: Index, serverlessNamespace: Index;

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone.index(serverlessIndexName);
  serverlessNamespace = serverlessIndex.namespace(globalNamespaceOne);
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
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.vectors?.length).toBe(10);
    expect(listResults.pagination?.next).toBeDefined();
  });

  test('test listPaginated with limit and pagination', async () => {
    const listResults = await serverlessNamespace.listPaginated({
      prefix,
      limit: 3,
    });
    expect(listResults.namespace).toBe(globalNamespaceOne);
    expect(listResults.vectors?.length).toBe(3);
    expect(listResults.pagination?.next).toBeDefined();

    const listResultsPg2 = await serverlessNamespace.listPaginated({
      prefix,
      limit: 5,
      paginationToken: listResults.pagination?.next,
    });

    expect(listResultsPg2.namespace).toBe(globalNamespaceOne);
    expect(listResultsPg2.vectors?.length).toBe(5);
  });
});
