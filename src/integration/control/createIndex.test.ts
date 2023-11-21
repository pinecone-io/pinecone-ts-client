import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName } from '../test-helpers';

describe('create index', () => {
  let indexName;
  let pinecone: Pinecone;

  beforeEach(async () => {
    indexName = randomIndexName('createIndex');
    pinecone = new Pinecone();
  });

  describe('happy path', () => {
    afterEach(async () => {
      await pinecone.deleteIndex(indexName);
    });

    test('simple create', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      const description = await pinecone.describeIndex(indexName);
      expect(description.name).toEqual(indexName);
      expect(description.dimension).toEqual(5);
      expect(description.metric).toEqual('cosine');
      expect(description.host).toBeDefined();
    });

    test('create with optional properties', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'euclidean',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.name).toEqual(indexName);
      expect(description.dimension).toEqual(5);
      expect(description.metric).toEqual('euclidean');
      expect(description.host).toBeDefined();
    });

    test('create with utility prop: waitUntilReady', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
        waitUntilReady: true,
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.name).toEqual(indexName);
      expect(description.status?.state).toEqual('Ready');
    });

    test('create with utility prop: suppressConflicts', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
        suppressConflicts: true,
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.name).toEqual(indexName);
    });
  });

  describe('error cases', () => {
    test('create index with invalid index name', async () => {
      try {
        await pinecone.createIndex({
          name: indexName + '-',
          dimension: 5,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });
      } catch (e) {
        const err = e as PineconeNotFoundError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('alphanumeric character');
      }
    });

    test('insufficient quota', async () => {
      try {
        await pinecone.createIndex({
          name: indexName,
          dimension: 5,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });
      } catch (e) {
        const err = e as PineconeNotFoundError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('exceeds the project quota');
      }
    });

    test('create from non-existent collection', async () => {
      try {
        await pinecone.createIndex({
          name: indexName,
          dimension: 5,
          metric: 'cosine',
          spec: {
            pod: {
              environment: 'us-east-1-aws',
              replicas: 1,
              shards: 1,
              podType: 'p1.x1',
              pods: 1,
              sourceCollection: 'non-existent-collection',
            },
          },
        });
      } catch (e) {
        const err = e as PineconeNotFoundError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('failed to fetch source collection');
      }
    });
  });
});
