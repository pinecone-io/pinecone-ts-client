import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName } from '../test-helpers';

describe('describe index', () => {
  let indexName;
  let pinecone: Pinecone;

  beforeEach(async () => {
    indexName = randomIndexName('describeIndex');
    pinecone = new Pinecone();

    await pinecone.createIndex({
      name: indexName,
      dimension: 5,
      metric: 'cosine',
      cloud: 'gcp',
      region: 'us-east1',
      capacityMode: 'pod',
      environment: 'us-east1-gcp',
    });
  });

  afterEach(async () => {
    await pinecone.deleteIndex(indexName);
  });

  test('describe index', async () => {
    const description = await pinecone.describeIndex(indexName);
    expect(description.database?.name).toEqual(indexName);
    expect(description.database?.dimension).toEqual(5);
    expect(description.database?.metric).toEqual('cosine');
    expect(description.status?.host).toBeDefined();
  });

  test('describe index with invalid index name', async () => {
    expect.assertions(1);
    try {
      await pinecone.describeIndex('non-existent-index');
    } catch (e) {
      const err = e as PineconeNotFoundError;
      expect(err.name).toEqual('PineconeNotFoundError');
    }
  });
});
