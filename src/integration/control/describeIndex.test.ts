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
    expect(description.database?.pods).toEqual(1);
    expect(description.database?.replicas).toEqual(1);
    expect(description.database?.shards).toEqual(1);
    expect(description.status?.host).toBeDefined();
  });

  test('describe index with invalid index name', async () => {
    try {
      await pinecone.describeIndex('non-existent-index');
    } catch (e) {
      const err = e as PineconeNotFoundError;
      expect(err.name).toEqual('PineconeNotFoundError');
      expect(err.message).toEqual(
        `A call to https://controller.${process.env.PINECONE_ENVIRONMENT}.pinecone.io/databases/non-existent-index returned HTTP status 404.`
      );
    }
  });
});
