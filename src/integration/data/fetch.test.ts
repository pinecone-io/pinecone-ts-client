import { Pinecone, Index } from '../../index';
import {
  serverlessIndexName,
  globalNamespaceOne,
  waitUntilReady,
} from '../test-helpers';

// todo: add pod tests

let pinecone: Pinecone,
  serverlessIndex: Index,
  recordIds: Array<string> | undefined;

const getRecordIds = async () => {
  await waitUntilReady(serverlessIndexName);
  const pag = await serverlessIndex.listPaginated();
  const ids: Array<string> = [];

  if (pag.vectors) {
    for (const vector of pag.vectors) {
      if (vector.id) {
        ids.push(vector.id);
      } else {
        console.log('No record ID found for vector:', vector);
      }
    }
  }
  if (ids.length > 0) {
    return ids;
  } else {
    console.log('No record IDs found in the serverless index');
  }
};

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
  recordIds = await getRecordIds();
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
