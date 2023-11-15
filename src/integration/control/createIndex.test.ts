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
        cloud: 'aws',
        region: 'us-east1',
        capacityMode: 'serverless',
      });
      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.name).toEqual(indexName);
      expect(description.database?.dimension).toEqual(5);
      expect(description.database?.metric).toEqual('cosine');
      expect(description.status?.host).toBeDefined();
    });

    test('create with optional properties', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'euclidean',
        replicas: 2,
        podType: 'p1.x2',
        cloud: 'aws',
        region: 'us-east1',
        capacityMode: 'serverless',
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.name).toEqual(indexName);
      expect(description.database?.dimension).toEqual(5);
      expect(description.database?.metric).toEqual('euclidean');
      expect(description.status?.host).toBeDefined();
    });

    test('create with utility prop: waitUntilReady', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        cloud: 'aws',
        metric: 'cosine',
        region: 'us-east1',
        capacityMode: 'serverless',
        waitUntilReady: true,
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.name).toEqual(indexName);
      expect(description.status?.state).toEqual('Ready');
    });

    test('create with utility prop: suppressConflicts', async () => {
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        cloud: 'aws',
        metric: 'cosine',
        region: 'us-east1',
        capacityMode: 'serverless',
      });
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        cloud: 'aws',
        metric: 'cosine',
        region: 'us-east1',
        capacityMode: 'serverless',
        suppressConflicts: true,
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.name).toEqual(indexName);
    });
  });

  describe('error cases', () => {
    test('create index with invalid index name', async () => {
      try {
        await pinecone.createIndex({
          name: indexName + '-',
          dimension: 5,
          cloud: 'aws',
          metric: 'cosine',
          region: 'us-east1',
          capacityMode: 'serverless',
        });
      } catch (e) {
        const err = e as PineconeNotFoundError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('alphanumeric characters');
      }
    });

    test('insufficient quota', async () => {
      try {
        await pinecone.createIndex({
          name: indexName,
          dimension: 5,
          cloud: 'aws',
          metric: 'cosine',
          region: 'us-east1',
          capacityMode: 'serverless',
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
          cloud: 'aws',
          metric: 'cosine',
          region: 'us-east1',
          capacityMode: 'serverless',
        });
      } catch (e) {
        const err = e as PineconeNotFoundError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('failed to fetch source collection');
      }
    });
  });
});
