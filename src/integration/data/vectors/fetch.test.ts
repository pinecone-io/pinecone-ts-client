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

describe('fetch; serverless index, global namespace one', () => {
  test('fetch by id', async () => {
    if (recordIds) {
      const results = await serverlessIndex.fetch(recordIds.slice(0, 3));
      expect(results.records[recordIds[0]].id).toBeDefined();
      expect(results.records[recordIds[1]].id).toBeDefined();
      expect(results.records[recordIds[2]].id).toBeDefined();
      expect(results.usage?.readUnits).toBeDefined();
    }
  });
});
