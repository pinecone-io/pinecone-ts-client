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

<<<<<<< HEAD
    expect(indexes?.map((i) => i.name)).toContain(indexName);
=======
    expect(indexes?.map((i) => i.database.name)).toContain(indexName);
>>>>>>> 20de0e0 (re-generate and update openapi core in pinecone-generated-ts-fetch, update relevant typescript types, fix bug in vectorOperationsProvider, update related unit tests)
  });
});
