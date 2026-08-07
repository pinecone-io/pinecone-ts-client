import { Pinecone, Index } from '../../../index';
import { globalNamespaceOne, getRecordIds } from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone,
  serverlessIndex: Index,
  recordIds: Array<string> | undefined;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });
  recordIds = await getRecordIds(serverlessIndex);
});

describe('fetchDocuments; serverless index, global namespace one', () => {
  test('fetch by id', async () => {
    if (recordIds) {
      const results = await serverlessIndex.fetchDocuments({
        ids: recordIds.slice(0, 3),
      });
      expect(results.documents[recordIds[0]]._id).toBeDefined();
      expect(results.documents[recordIds[1]]._id).toBeDefined();
      expect(results.documents[recordIds[2]]._id).toBeDefined();
      expect(results.namespace).toEqual(globalNamespaceOne);
      expect(results.usage).toBeDefined();
    }
  });
});
