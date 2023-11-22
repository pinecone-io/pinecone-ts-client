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
        pod: {
          environment: 'us-east1-gcp',
          replicas: 1,
          shards: 1,
          podType: 'p1.x1',
          pods: 1,
        },
      },
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
