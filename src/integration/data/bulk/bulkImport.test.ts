import { Pinecone, Index } from '../../../index';

describe('bulk import', () => {
  let pinecone: Pinecone, index: Index;

  const name = 'bulk-import-integration-test';

  beforeAll(async () => {
    pinecone = new Pinecone();
    await pinecone.createIndex({
      name: name,
      dimension: 10,
      metric: 'cosine',
      spec: {
        serverless: {
          region: 'us-west-2',
          cloud: 'aws',
        },
      },
      waitUntilReady: true,
    });

    index = pinecone.index(name);
  });

  afterAll(async () => {
    await pinecone.deleteIndex(name);
  });
});
