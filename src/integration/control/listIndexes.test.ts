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
      cloud: 'gcp',
      region: 'us-east1',
      capacityMode: 'pod',
    });
  });

  afterEach(async () => {
    await pinecone.deleteIndex(indexName);
  });

  test('list indexes', async () => {
    const indexes = await pinecone.listIndexes();
    expect(indexes).toBeDefined();
    expect(indexes?.length).toBeGreaterThan(0);

    expect(indexes?.map((i) => i.name)).toContain(indexName);
  });
});
