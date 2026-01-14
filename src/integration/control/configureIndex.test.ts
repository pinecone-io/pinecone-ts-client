import { BasePineconeError, PineconeBadRequestError } from '../../errors';
import { Pinecone } from '../../index';
import {
  randomIndexName,
  retryDeletes,
  waitUntilIndexReady,
} from '../test-helpers';

let podIndexName: string, serverlessIndexName: string, pinecone: Pinecone;

describe('configure index', () => {
  beforeAll(async () => {
    pinecone = new Pinecone();
    podIndexName = randomIndexName('pod-configure');
    serverlessIndexName = randomIndexName('serverless-configure');

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
      tags: { project: 'pinecone-integration-tests' },
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
      tags: { project: 'pinecone-integration-tests' },
    });
  });

  afterAll(async () => {
    // Note: using retryDeletes instead of waitUntilReady due to backend bug where index status is ready, but index
    // is actually still upgrading
    await retryDeletes(pinecone, podIndexName);
    await retryDeletes(pinecone, serverlessIndexName);
  });

  describe('serverless index', () => {
    test('enable and disable deletionProtection', async () => {
      await pinecone.configureIndex(serverlessIndexName, {
        deletionProtection: 'enabled',
      });
      await waitUntilIndexReady(serverlessIndexName);

      // verify we cannot delete the index
      await pinecone.deleteIndex(serverlessIndexName).catch((e) => {
        const err = e as PineconeBadRequestError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          'Deletion protection is enabled for this index'
        );
      });

      // disable so we can clean the index up
      await pinecone.configureIndex(serverlessIndexName, {
        deletionProtection: 'disabled',
      });
    });

    test('Add/remove index tag(s) on serverless index', async () => {
      const description = await pinecone.describeIndex(serverlessIndexName);
      expect(description.tags).toEqual({
        project: 'pinecone-integration-tests',
      });

      // Add a tag
      await pinecone.configureIndex(serverlessIndexName, {
        tags: { testTag: 'testValue' },
      });
      const description2 = await pinecone.describeIndex(serverlessIndexName);
      expect(description2.tags).toEqual({
        project: 'pinecone-integration-tests',
        testTag: 'testValue',
      });

      // Remove that tag
      await pinecone.configureIndex(serverlessIndexName, {
        tags: { testTag: '' }, // Passing null/undefined here is not allowed due to type safety (must eval to string)
      });
      const description3 = await pinecone.describeIndex(serverlessIndexName);
      if (description3.tags != null) {
        expect(description3.tags['testTag']).toBeUndefined();
        expect(description3.tags['project']).toEqual(
          'pinecone-integration-tests'
        );
      }

      // Confirm when config'ing other things about the index, tags are not changed
      await pinecone.configureIndex(serverlessIndexName, {
        deletionProtection: 'enabled',
      });
      const description4 = await pinecone.describeIndex(serverlessIndexName);
      if (description4.tags != null) {
        expect(description4.tags['testTag']).toBeUndefined();
        expect(description4.tags['project']).toEqual(
          'pinecone-integration-tests'
        );
      }

      // (Cleanup) Disable deletion protection
      await pinecone.configureIndex(serverlessIndexName, {
        deletionProtection: 'disabled',
      });
    });

    test('Update a tag value in a serverless index', async () => {
      const description = await pinecone.describeIndex(serverlessIndexName);
      expect(description.tags).toEqual({
        project: 'pinecone-integration-tests',
      });

      await pinecone.configureIndex(serverlessIndexName, {
        tags: { project: 'updated-project' },
      });
      const description2 = await pinecone.describeIndex(serverlessIndexName);
      if (description2.tags != null) {
        expect(description2.tags['project']).toEqual('updated-project');
      }
    });
  });
});
