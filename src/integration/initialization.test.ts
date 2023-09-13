import { Pinecone } from '../index';

describe('Client initialization', () => {
  test('can accept a config object', () => {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || '',
    });
    expect(client).toBeDefined();
  });

  test('can accept no arguments and read from environment variables', () => {
    const client = new Pinecone();
    expect(client).toBeDefined();
  });
});
