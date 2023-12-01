import { Pinecone } from '../../index';
import { randomIndexName } from '../test-helpers';

describe('list indexes', () => {
  let indexName;
  let pinecone: Pinecone;

  beforeEach(async () => {
    indexName = randomIndexName('listIndexes');
    pinecone = new Pinecone();

    await pinecone.createIndex({
      name: indexName,
      dimension: 5,
      metric: 'cosine',
      spec: {
        serverless: {
          region: 'us-west-2',
          cloud: 'aws',
        },
      },
      waitUntilReady: true,
    });
  });

  afterEach(async () => {
    await pinecone.deleteIndex(indexName);
  });

  test('list indexes', async () => {
    const response = await pinecone.listIndexes();
    expect(response.indexes).toBeDefined();
    expect(response.indexes?.length).toBeGreaterThan(0);

    expect(response.indexes?.map((i) => i.name)).toContain(indexName);
  });
});
