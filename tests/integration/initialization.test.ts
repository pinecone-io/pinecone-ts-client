import { Pinecone } from '../../dist';

describe('Client initialization: Pinecone.createClient', () => {
  test('can accept a config object', async () => {
    const client = await Pinecone.createClient({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || '',
    });
    expect(client).toBeDefined();
  });

  test('can accept no arguments and read from environment variables', async () => {
    const client = await Pinecone.createClient();
    expect(client).toBeDefined();
  });
});
