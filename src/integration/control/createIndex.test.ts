import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName } from '../test-helpers';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('create index', () => {
  describe('happy path', () => {
    test('simple create', async () => {
      const indexName = randomIndexName('serverless-create');
      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
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
      expect(description.metric).toEqual('cosine');
      expect(description.host).toBeDefined();
      expect(description.tags).toEqual({
        project: 'pinecone-integration-tests',
      });

      await pinecone.deleteIndex(indexName);
    });

    test('create with metric', async () => {
      const indexName = randomIndexName('serverless-create');

      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'euclidean',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2',
          },
        },
        waitUntilReady: true,
      });

      const description = await pinecone.describeIndex(indexName);
      expect(description.name).toEqual(indexName);
      expect(description.dimension).toEqual(5);
      expect(description.metric).toEqual('euclidean');
      expect(description.host).toBeDefined();

      await pinecone.deleteIndex(indexName);
    });

    // todo: add polling to this to ensure it's actually testing the waitUntilReady feature
    test.skip('Skip until can add polling to actually test this feature', async () => {
      const indexName = randomIndexName('serverless-create');

      test('create with utility prop: waitUntilReady', async () => {
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
        });

        const description = await pinecone.describeIndex(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.status?.state).toEqual('Ready');
      });
    });

    // todo: add a conflict to actually test the suppressConflicts feature
    test.skip('Skip until can build in a conflict that should arise that is subsequently suppressed', async () => {
      test('create with utility prop: suppressConflicts', async () => {
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
          suppressConflicts: true,
          waitUntilReady: true,
        });

        const description = await pinecone.describeIndex(indexName);
        expect(description.name).toEqual(indexName);
      });
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

    // todo: trigger an insufficient quota scenario
    test.skip('This literally tests nothing and passes no matter what you do', async () => {
      test('insufficient quota', async () => {
        const indexName = randomIndexName('serverless-create');

        try {
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
          });
        } catch (e) {
          const err = e as PineconeNotFoundError;
          // todo: this err.name is not actually checking anything; can put nonsense in there & test passes
          expect(err.name).toEqual('PineconeBadRequestErsdfdror');
          // todo: this err.message is not actually checking anything; can put nonsense in there & test passes
          expect(err.message).toContain('exsdfdceeds the project quota');
        }
      });
    });

    test('create from non-existent collection', async () => {
      const indexName = randomIndexName('serverless-create');

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
  });
});
