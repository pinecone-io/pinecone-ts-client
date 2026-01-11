import { Pinecone, Index } from '../../../index';
import { randomIndexName, retryDeletes } from '../../test-helpers';

describe('bulk import', () => {
  let pinecone: Pinecone, index: Index;

  const indexName = randomIndexName('bulk-import-integration-test');
  const testURI = 's3://dev-bulk-import-datasets-pub/10-records-dim-10/';

  beforeAll(async () => {
    pinecone = new Pinecone();
    await pinecone.createIndex({
      name: indexName,
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

    index = pinecone.index({ name: indexName });
  });

  afterAll(async () => {
    await retryDeletes(pinecone, indexName);
  });

  test('verify bulk import', async () => {
    const response = await index.startImport(testURI);
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
  });
});
