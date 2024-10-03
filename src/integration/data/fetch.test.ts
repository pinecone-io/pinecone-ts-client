import { Pinecone, Index } from '../../index';
import {
  serverlessIndexName,
  globalNamespaceOne,
  recordIDs,
} from '../test-helpers';

// todo: add pod tests

let pinecone: Pinecone, serverlessIndex: Index, recordIds: Array<string>;

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
  recordIds = recordIDs ? recordIDs.split(',') : [];
});

describe('fetch; serverless index, global namespace one', () => {
  test('fetch by id', async () => {
    const results = await serverlessIndex.fetch(recordIds.slice(0, 3));
    expect(results.records[recordIds[0]].id).toBeDefined();
    expect(results.records[recordIds[1]].id).toBeDefined();
    expect(results.records[recordIds[2]].id).toBeDefined();
    expect(results.usage?.readUnits).toBeDefined();
  });
});
