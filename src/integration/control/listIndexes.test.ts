import { Pinecone } from '../../index';
import { getTestContext } from '../test-context';

let pinecone: Pinecone, serverlessIndexName: string;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  serverlessIndexName = fixtures.serverlessIndex.name;
});

describe('list indexes; serverless', () => {
  test('list indexes', async () => {
    const response = await pinecone.listIndexes();
    expect(response.indexes).toBeDefined();
    expect(response.indexes?.length).toBeGreaterThan(0);
    expect(response.indexes?.map((i) => i.name)).toContain(serverlessIndexName);
  });
});
