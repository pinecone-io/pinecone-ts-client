import { Pinecone, Index } from '../../index';
import {
  serverlessIndexName,
  globalNamespaceOne,
  recordIDs,
} from '../test-helpers';

let pinecone: Pinecone, serverlessIndex: Index;

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone.index(serverlessIndexName);
});

describe('fetch; serverless index, global namespace one', () => {
  test('fetch by id', async () => {
    const results = await serverlessIndex
      .namespace(globalNamespaceOne)
      .fetch(recordIDs.split(','));
    expect(results.records[0]).toBeDefined();
    expect(results.records[1]).toBeDefined();
    expect(results.records[2]).toBeDefined();
    expect(results.usage?.readUnits).toBeDefined();
  });
});
