import { Pinecone, Index } from '../../../index';

describe('bulk import', () => {
  let pinecone: Pinecone, index: Index;

  const name = 'bulk-import-integration-test';
  const testURI = 's3://dev-bulk-import-datasets-pub/10-records-dim-10/';

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

  test('verify bulk import', async () => {
    const response = await index.startImport(testURI);
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
  });
});
