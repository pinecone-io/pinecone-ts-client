import { Pinecone } from '../../index';
import { describe } from 'node:test';

let pinecone: Pinecone, serverlessIndexName: string;

beforeAll(async () => {
  pinecone = new Pinecone();
  if (!process.env.SERVERLESS_INDEX_NAME) {
    throw new Error('SERVERLESS_INDEX_NAME environment variable is not set');
  }
  serverlessIndexName = process.env.SERVERLESS_INDEX_NAME;
});

describe('list indexes; serverless', () => {
  test('list indexes', async () => {
    const response = await pinecone.listIndexes();
    expect(response.indexes).toBeDefined();
    expect(response.indexes?.length).toBeGreaterThan(0);
    expect(response.indexes?.map((i) => i.name)).toContain(serverlessIndexName);
  });
});
