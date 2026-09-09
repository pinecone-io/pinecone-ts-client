import { Pinecone, Index } from '../../../index';
import { globalNamespaceOne, getRecordIds } from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone, serverlessIndex: Index, recordIds: Array<string>;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });
  recordIds = (await getRecordIds(serverlessIndex)) ?? [];
  expect(recordIds.length).toBeGreaterThanOrEqual(3);
});

describe('fetchDocuments; serverless index, global namespace one', () => {
  test('fetch by id', async () => {
    const results = await serverlessIndex.fetchDocuments({
      ids: recordIds.slice(0, 3),
    });
    recordIds.slice(0, 3).forEach((id) => {
      expect(results.documents[id]?._id).toEqual(id);
    });
    expect(results.namespace).toEqual(globalNamespaceOne);
    expect(results.usage).toBeDefined();
  });
});
