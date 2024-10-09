import { Pinecone, Index } from '../../index';
import { globalNamespaceOne, getRecordIds } from '../test-helpers';

// todo: add pod tests

let pinecone: Pinecone,
  serverlessIndex: Index,
  recordIds: Array<string> | undefined;

beforeAll(async () => {
  pinecone = new Pinecone();
  if (!process.env.SERVERLESS_INDEX_NAME) {
    throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
  }

  const serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;
  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
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
