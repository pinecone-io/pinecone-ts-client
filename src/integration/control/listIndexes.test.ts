import { Pinecone } from '../../index';
import { serverlessIndexName } from '../test-helpers';
import { describe } from 'node:test';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('list indexes; serverless', () => {
  test('list indexes', async () => {
    const response = await pinecone.listIndexes();
    expect(response.indexes).toBeDefined();
    expect(response.indexes?.length).toBeGreaterThan(0);
    expect(response.indexes?.map((i) => i.name)).toContain(serverlessIndexName);
  });
});
