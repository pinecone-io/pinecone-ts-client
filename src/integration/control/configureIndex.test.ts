import { BasePineconeError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName, waitUntilReady } from '../test-helpers';

describe('configure index', () => {
  let indexName;
  let pinecone: Pinecone;

  beforeEach(async () => {
    pinecone = new Pinecone();
    indexName = randomIndexName('configureIndex');

    await pinecone.createIndex({
      name: indexName,
      dimension: 5,
      waitUntilReady: true,
      podType: 'p1.x1',
    });
  });

  afterEach(async () => {
    await pinecone.deleteIndex(indexName);
  });

  describe('error handling', () => {
    test('configure index with invalid index name', async () => {
      try {
        await pinecone.configureIndex('non-existent-index', { replicas: 2 });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeNotFoundError');
        expect(err.message).toEqual(
          `A call to https://controller.${process.env.PINECONE_ENVIRONMENT}.pinecone.io/databases/non-existent-index returned HTTP status 404.`
        );
      }
    });

    test('configure index when exceeding quota', async () => {
      try {
        await pinecone.configureIndex(indexName, { replicas: 20 });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('The index exceeds the project quota');
        expect(err.message).toContain(
          'Upgrade your account or change the project settings to increase the quota.'
        );
      }
    });
  });

  describe('scaling replicas', () => {
    test('up and down', async () => {
      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.replicas).toEqual(1);

      // Scale up
      await pinecone.configureIndex(indexName, { replicas: 2 });
      const description2 = await pinecone.describeIndex(indexName);
      expect(description2.database?.replicas).toEqual(2);

      await waitUntilReady(indexName);

      // Scale down
      await pinecone.configureIndex(indexName, { replicas: 1 });
      const description3 = await pinecone.describeIndex(indexName);
      expect(description3.database?.replicas).toEqual(1);
    });
  });

  describe('scaling pod type', () => {
    test('scaling podType: changing base pod type', async () => {
      // Verify the starting state
      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.podType).toEqual('p1.x1');

      try {
        // Try to change the base pod type
        await pinecone.configureIndex(indexName, { podType: 'p2.x1' });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          'updating base pod type is not supported'
        );
      }
    });

    test('scaling podType: size increase', async () => {
      // Verify the starting state
      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.podType).toEqual('p1.x1');

      await pinecone.configureIndex(indexName, { podType: 'p1.x2' });
      const description2 = await pinecone.describeIndex(indexName);
      expect(description2.database?.podType).toEqual('p1.x2');
    });

    test('scaling podType: size down', async () => {
      // Verify the starting state
      const description = await pinecone.describeIndex(indexName);
      expect(description.database?.podType).toEqual('p1.x1');

      // Size up
      await pinecone.configureIndex(indexName, { podType: 'p1.x2' });
      const description2 = await pinecone.describeIndex(indexName);
      expect(description2.database?.podType).toEqual('p1.x2');

      await waitUntilReady(indexName);

      try {
        // try to size down
        await pinecone.configureIndex(indexName, { podType: 'p1.x1' });
        const description3 = await pinecone.describeIndex(indexName);
        expect(description3.database?.podType).toEqual('p1.x1');
      } catch (e) {
        const err = e as BasePineconeError;

        if (err.name === 'PineconeBadRequestError') {
          expect(err.message).toContain(
            'scaling down pod type is not supported'
          );
        } else if (err.name === 'PineconeInternalServerError') {
          // noop. Seems like the API is sometimes returns 500 when scaling up
          // and down in quick succession. But it's not a client issue so I
          // don't want to fail the test in that case.
        } else {
          throw err;
        }
      }
    });
  });
});
