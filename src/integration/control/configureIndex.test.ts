import { BasePineconeError, PineconeBadRequestError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName, waitUntilReady } from '../test-helpers';

describe('configure index', () => {
  let podIndexName, serverlessIndexName;
  let pinecone: Pinecone;

  beforeAll(async () => {
    pinecone = new Pinecone();
    podIndexName = randomIndexName('configureIndex');
    serverlessIndexName = randomIndexName('configureIndex');

    // create pod index
    await pinecone.createIndex({
      name: podIndexName,
      dimension: 5,
      metric: 'cosine',
      spec: {
        pod: {
          environment: 'us-east1-gcp',
          podType: 'p1.x1',
          pods: 1,
        },
      },
      waitUntilReady: true,
    });

    // create serverless index
    await pinecone.createIndex({
      name: serverlessIndexName,
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
  });

  afterAll(async () => {
    // wait until indexes are done upgrading before deleting
    await waitUntilReady(podIndexName);
    await waitUntilReady(serverlessIndexName);

    await pinecone.deleteIndex(podIndexName);
    await pinecone.deleteIndex(serverlessIndexName);
  });

  describe('pod index', () => {
    test('scale replicas up', async () => {
      const description = await pinecone.describeIndex(podIndexName);
      expect(description.spec.pod?.replicas).toEqual(1);

      await pinecone.configureIndex(podIndexName, {
        spec: { pod: { replicas: 2 } },
      });
      const description2 = await pinecone.describeIndex(podIndexName);
      expect(description2.spec.pod?.replicas).toEqual(2);
    });

    test('scale podType up', async () => {
      // Verify the starting state
      const description = await pinecone.describeIndex(podIndexName);
      expect(description.spec.pod?.podType).toEqual('p1.x1');

      await pinecone.configureIndex(podIndexName, {
        spec: { pod: { podType: 'p1.x2' } },
      });
      const description2 = await pinecone.describeIndex(podIndexName);
      expect(description2.spec.pod?.podType).toEqual('p1.x2');
    });
  });

  describe('serverless index', () => {
    test('enable and disable deletionProtection', async () => {
      await pinecone.configureIndex(serverlessIndexName, {
        deletionProtection: 'enabled',
      });

      await waitUntilReady(serverlessIndexName);

      // verify we cannot delete the index
      await pinecone.deleteIndex(serverlessIndexName).catch((e) => {
        const err = e as PineconeBadRequestError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          'Deletion protection is enabled for this index',
        );
      });

      // disable so we can clean the index up
      await pinecone.configureIndex(serverlessIndexName, {
        deletionProtection: 'disabled',
      });
    });
  });

  describe('error cases', () => {
    test('cannot configure index with invalid index name', async () => {
      try {
        await pinecone.configureIndex('non-existent-index', {
          spec: { pod: { replicas: 2 } },
        });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeNotFoundError');
      }
    });

    test('cannot configure index when exceeding quota', async () => {
      try {
        await pinecone.configureIndex(podIndexName, {
          spec: { pod: { replicas: 20 } },
        });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          `You've reached the max pods allowed in project`,
        );
        expect(err.message).toContain(
          'To increase this limit, adjust your project settings in the console',
        );
      }
    });

    test('cannot change base pod type', async () => {
      try {
        // Try to change the base pod type
        await pinecone.configureIndex(podIndexName, {
          spec: { pod: { podType: 'p2.x1' } },
        });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain('Bad request: Cannot change pod type');
      }
    });

    test('cannot set deletionProtection value other than enabled / disabled', async () => {
      try {
        await pinecone.configureIndex(serverlessIndexName, {
          // @ts-expect-error
          deletionProtection: 'bogus',
        });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          'Invalid deletion_protection, value should be either enabled or disabled',
        );
      }
    });

    test('cannot configure pod spec for serverless', async () => {
      try {
        await pinecone.configureIndex(serverlessIndexName, {
          spec: { pod: { replicas: 2 } },
        });
      } catch (e) {
        const err = e as BasePineconeError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          'Configuring replicas and pod type is not supported for serverless',
        );
      }
    });
  });
});
