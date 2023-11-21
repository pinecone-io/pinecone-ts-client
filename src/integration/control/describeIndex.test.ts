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

  test('describe index', async () => {
    const description = await pinecone.describeIndex(indexName);
    expect(description.name).toEqual(indexName);
    expect(description.dimension).toEqual(5);
    expect(description.metric).toEqual('cosine');
    expect(description.host).toBeDefined();
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
