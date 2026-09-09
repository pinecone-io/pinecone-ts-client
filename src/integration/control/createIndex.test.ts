import { PineconeArgumentError, PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { randomName, cleanupResources } from '../test-helpers';

let pinecone: Pinecone;
const indexNames: string[] = [];
const trackIndex = (name: string) => {
  indexNames.push(name);
  return name;
};
const cleanupTrackedResources = async () => {
  await cleanupResources(pinecone, indexNames);
  // Retain names after failure so a later hook can retry the deletion.
  indexNames.length = 0;
};
afterEach(cleanupTrackedResources, 60_000);
afterAll(cleanupTrackedResources, 60_000);

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('create index', () => {
  describe('managed (serverless) index tests', () => {
    describe('happy path', () => {
      test('create dense index', async () => {
        const indexName = trackIndex(randomName('serverless-create'));
        await pinecone.indexes.create({
          name: indexName,
          deployment: {
            deploymentType: 'managed',
            cloud: 'aws',
            region: 'us-west-2',
          },
          schema: {
            fields: {
              embedding: {
                type: 'dense_vector',
                dimension: 5,
                metric: 'cosine',
              },
            },
          },
          waitUntilReady: true,
          timeout: 180_000,
          tags: { project: 'pinecone-integration-tests' },
        });
        const description = await pinecone.indexes.describe(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.host).toBeDefined();
        expect(description.tags).toEqual({
          project: 'pinecone-integration-tests',
        });

        // `dimension` and `metric` now live on the `dense_vector` schema field.
        const embedding = description.schema.fields['embedding'];
        if (!('type' in embedding) || embedding.type !== 'dense_vector') {
          throw new Error('expected `embedding` to be a dense_vector field');
        }
        expect(embedding.dimension).toEqual(5);
        expect(embedding.metric).toEqual('cosine');

        expect(description.deployment.deploymentType).toEqual('managed');

        // `readCapacity` is a top-level property and defaults to OnDemand.
        expect(description.readCapacity?.mode).toEqual('OnDemand');
      });

      test('create index with Dedicated read capacity', async () => {
        const indexName = trackIndex(randomName('svrlss-dedicated'));
        await pinecone.indexes.create({
          name: indexName,
          deployment: {
            deploymentType: 'managed',
            cloud: 'aws',
            region: 'us-east-1',
          },
          schema: {
            fields: {
              embedding: {
                type: 'dense_vector',
                dimension: 5,
                metric: 'cosine',
              },
            },
          },
          // `readCapacity` moved out of the old `spec.serverless` envelope to the
          // top level, and takes the API's nested `dedicated` shape.
          readCapacity: {
            mode: 'Dedicated',
            dedicated: {
              nodeType: 'b1',
              scaling: 'Manual',
              manual: { replicas: 2, shards: 1 },
            },
          },
          waitUntilReady: true,
          timeout: 180_000,
          tags: { project: 'pinecone-integration-tests' },
        });
        const description = await pinecone.indexes.describe(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.host).toBeDefined();

        const readCapacity = description.readCapacity;
        expect(readCapacity?.mode).toEqual('Dedicated');
        if (readCapacity && readCapacity.mode === 'Dedicated') {
          expect(readCapacity.dedicated?.nodeType).toEqual('b1');
          expect(readCapacity.dedicated?.manual?.replicas).toEqual(2);
          expect(readCapacity.dedicated?.manual?.shards).toEqual(1);
        }
      });

      test('create sparse index', async () => {
        const indexName = trackIndex(randomName('svrlss-sparse-create'));

        await pinecone.indexes.create({
          name: indexName,
          deployment: {
            deploymentType: 'managed',
            cloud: 'aws',
            region: 'us-east-1',
          },
          // A `sparse_vector` field carries neither `dimension` nor `metric`.
          schema: {
            fields: {
              sparse_embedding: { type: 'sparse_vector' },
            },
          },
        });

        const description = await pinecone.indexes.describe(indexName);
        expect(description.name).toEqual(indexName);
        expect(description.host).toBeDefined();

        const sparse = description.schema.fields['sparse_embedding'];
        expect('type' in sparse && sparse.type).toEqual('sparse_vector');
      });
    });

    describe('error cases', () => {
      test('create index with invalid index name', async () => {
        expect.assertions(2);
        try {
          const indexName = randomName('serverless-create') + '-';

          await pinecone.indexes.create({
            name: indexName,
            deployment: {
              deploymentType: 'managed',
              cloud: 'aws',
              region: 'us-west-2',
            },
            schema: {
              fields: {
                embedding: {
                  type: 'dense_vector',
                  dimension: 5,
                  metric: 'cosine',
                },
              },
            },
          });
          trackIndex(indexName);
        } catch (e) {
          const err = e as PineconeNotFoundError;
          expect(err.name).toEqual('PineconeBadRequestError');
          expect(err.message).toContain('alphanumeric character');
        }
      });

      test('create index without a schema', async () => {
        expect.assertions(2);
        const indexName = randomName('missing-schema');
        try {
          await pinecone.indexes.create({
            name: indexName,
            deployment: {
              deploymentType: 'managed',
              cloud: 'aws',
              region: 'us-east-1',
            },
          } as never);
          trackIndex(indexName);
        } catch (e) {
          const err = e as PineconeArgumentError;
          expect(err.name).toEqual('PineconeArgumentError');
          expect(err.message).toContain('You must pass a `schema` object');
        }
      });
    });
  });
});
