import { Pinecone, Index } from '../../index';
import {
  serverlessIndexName,
  globalNamespaceOne,
  recordIDs,
} from '../test-helpers';

let pinecone: Pinecone,
  serverlessIndex: Index,
  serverlessNamespace: Index,
  recordIds: Array<string>;

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone.index(serverlessIndexName);
  serverlessNamespace = serverlessIndex.namespace(globalNamespaceOne);
  recordIds = recordIDs.split(',');
});

describe('fetch; serverless index, global namespace one', () => {
  test('fetch by id', async () => {
    const results = await serverlessNamespace.fetch(recordIds.slice(0, 3));
    expect(results.records[recordIds[0]].id).toBeDefined();
    expect(results.records[recordIds[1]].id).toBeDefined();
    expect(results.records[recordIds[2]].id).toBeDefined();
    expect(results.usage?.readUnits).toBeDefined();
  });
});
