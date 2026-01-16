import { PineconeArgumentError, PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName } from '../test-helpers';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('create index', () => {
  describe('serverless index tests', () => {
    describe('happy path', () => {
      test('create dense index', async () => {
        const indexName = randomIndexName('serverless-create');
        await pinecone.createIndex({
          name: indexName,
          dimension: 5,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-west-2',
            },
          },
          waitUntilReady: true,
          tags: { project: 'pinecone-integration-tests' },
        });
        const description = await pinecone.describeIndex(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.dimension).toEqual(5);
        // defaults to 'cosine'
        expect(description.metric).toEqual('cosine');
        expect(description.host).toBeDefined();
        // defaults to 'dense'
        expect(description.vectorType).toEqual('dense');
        expect(description.tags).toEqual({
          project: 'pinecone-integration-tests',
        });
        // defaults to OnDemand read capacity
        expect('serverless' in description.spec).toBe(true);
        if ('serverless' in description.spec) {
          expect(description.spec.serverless?.readCapacity.mode).toEqual(
            'OnDemand'
          );
        }

        await pinecone.deleteIndex(indexName);
      });

      test('create serverless index with Dedicated read capacity', async () => {
        const indexName = randomIndexName('svrlss-dedicated');
        await pinecone.createIndex({
          name: indexName,
          dimension: 5,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                mode: 'Dedicated',
                nodeType: 'b1',
                manual: {
                  replicas: 2,
                  shards: 1,
                },
              },
            },
          },
          waitUntilReady: true,
          tags: { project: 'pinecone-integration-tests' },
        });
        const description = await pinecone.describeIndex(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.dimension).toEqual(5);
        // defaults to 'cosine'
        expect(description.metric).toEqual('cosine');
        expect(description.host).toBeDefined();
        // defaults to 'dense'
        expect(description.vectorType).toEqual('dense');
        expect(description.tags).toEqual({
          project: 'pinecone-integration-tests',
        });

        // Dedicated read capacity
        expect('serverless' in description.spec).toBe(true);
        if ('serverless' in description.spec) {
          const readCapacity = description.spec.serverless?.readCapacity;
          expect(readCapacity.mode).toEqual('Dedicated');

          if (readCapacity.mode === 'Dedicated') {
            expect(readCapacity.dedicated?.nodeType).toEqual('b1');
            expect(readCapacity.dedicated?.manual?.replicas).toEqual(2);
            expect(readCapacity.dedicated?.manual?.shards).toEqual(1);
          }
        }

        await pinecone.deleteIndex(indexName);
      });

      test('create sparse index', async () => {
        const indexName = randomIndexName('svrlss-sparse-create');

        await pinecone.createIndex({
          name: indexName,
          vectorType: 'sparse',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });

        const description = await pinecone.describeIndex(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.vectorType).toEqual('sparse');
        expect(description.host).toBeDefined();
        expect(description.metric).toEqual('dotproduct');

        await pinecone.deleteIndex(indexName);
      });
    });

    describe('error cases', () => {
      test('create index with invalid index name', async () => {
        try {
          const indexName = randomIndexName('serverless-create');

          await pinecone.createIndex({
            name: indexName + '-',
            dimension: 5,
            metric: 'cosine',
            spec: {
              serverless: {
                cloud: 'aws',
                region: 'us-west-2',
              },
            },
          });
        } catch (e) {
          const err = e as PineconeNotFoundError;
          expect(err.name).toEqual('PineconeBadRequestError');
          expect(err.message).toContain('alphanumeric character');
        }
      });

      test('create sparse index with invalid metric', async () => {
        try {
          const indexName = randomIndexName('sparse-error');
          await pinecone.createIndex({
            name: indexName,
            metric: 'cosine',
            vectorType: 'sparse',
            spec: {
              serverless: {
                cloud: 'aws',
                region: 'us-east-1',
              },
            },
          });
        } catch (e) {
          const err = e as PineconeArgumentError;
          expect(err.name).toEqual('PineconeArgumentError');
          expect(err.message).toContain(
            'Sparse indexes must have a `metric` of `dotproduct`'
          );
        }
      });

      test('create sparse index with invalid dimension', async () => {
        try {
          const indexName = randomIndexName('sparse-error');
          await pinecone.createIndex({
            name: indexName,
            dimension: 5,
            vectorType: 'sparse',
            spec: {
              serverless: {
                cloud: 'aws',
                region: 'us-east-1',
              },
            },
          });
        } catch (e) {
          const err = e as PineconeArgumentError;
          expect(err.name).toEqual('PineconeArgumentError');
          expect(err.message).toContain(
            'Sparse indexes cannot have a `dimension`'
          );
        }
      });
    });
  });

  describe('pod index tests', () => {
    describe('happy path', () => {
      test('create pod index', async () => {
        const indexName = randomIndexName('test-pod-create');
        await pinecone.createIndex({
          name: indexName,
          dimension: 5,
          metric: 'cosine',
          spec: {
            pod: {
              environment: 'us-east-1-aws',
              podType: 'p1.x1',
              pods: 1,
            },
          },
        });

        const description = await pinecone.describeIndex(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.dimension).toEqual(5);
        expect(description.metric).toEqual('cosine');
        expect(description.host).toBeDefined();
        expect(description.vectorType).toEqual('dense');

        await pinecone.deleteIndex(indexName);
      });
    });

    describe('error cases', () => {
      test('create from non-existent collection', async () => {
        const indexName = randomIndexName('collection-error');

        try {
          await pinecone.createIndex({
            name: indexName,
            dimension: 5,
            metric: 'cosine',
            spec: {
              pod: {
                environment: 'us-east-1-aws',
                podType: 'p1.x1',
                pods: 1,
                sourceCollection: 'non-existent-collection',
              },
            },
          });
        } catch (e) {
          const err = e as PineconeNotFoundError;
          expect(err.name).toEqual('PineconeBadRequestError');
          expect(err.message).toContain(
            'Resource non-existent-collection not found'
          );
        }
      });

      test('create sparse pod index', async () => {
        try {
          const indexName = randomIndexName('sparse-error');
          await pinecone.createIndex({
            name: indexName,
            dimension: 5,
            vectorType: 'sparse',
            spec: {
              pod: {
                environment: 'us-east-1-aws',
                podType: 'p1.x1',
                pods: 1,
                sourceCollection: 'non-existent-collection',
              },
            },
          });
        } catch (e) {
          const err = e as PineconeArgumentError;
          expect(err.name).toEqual('PineconeArgumentError');
          expect(err.message).toContain(
            'Pod indexes must have a `vectorType` of `dense`'
          );
        }
      });
    });
  });
});
