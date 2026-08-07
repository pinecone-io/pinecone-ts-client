import { PineconeBadRequestError } from '../../errors';
import { Pinecone } from '../../index';
import { randomName, retryDeletes, waitUntilIndexReady } from '../test-helpers';

let serverlessIndexName: string, pinecone: Pinecone;

describe('configure index', () => {
  beforeAll(async () => {
    pinecone = new Pinecone();
    serverlessIndexName = randomName('serverless-configure');

    // Create serverless index (removed unused pod index)
    await pinecone.indexes.create({
      name: serverlessIndexName,
      deployment: {
        deploymentType: 'managed',
        cloud: 'aws',
        region: 'us-east-1',
      },
      schema: {
        fields: {
          embedding: { type: 'dense_vector', dimension: 5, metric: 'cosine' },
        },
      },
      waitUntilReady: true,
      tags: { project: 'pinecone-integration-tests' },
    });
  });

  afterAll(async () => {
    // Note: using retryDeletes instead of waitUntilReady due to backend bug where index status is ready, but index
    // is actually still upgrading
    await retryDeletes(pinecone, serverlessIndexName);
  });

  describe('serverless index', () => {
    test('enable and disable deletionProtection', async () => {
      await pinecone.indexes.configure(serverlessIndexName, {
        deletionProtection: 'enabled',
      });
      await waitUntilIndexReady(serverlessIndexName);

      // verify we cannot delete the index
      await pinecone.indexes.delete(serverlessIndexName).catch((e) => {
        const err = e as PineconeBadRequestError;
        expect(err.name).toEqual('PineconeBadRequestError');
        expect(err.message).toContain(
          'Deletion protection is enabled for this index',
        );
      });

      // disable so we can clean the index up
      await pinecone.indexes.configure(serverlessIndexName, {
        deletionProtection: 'disabled',
      });
    });

    test('Add/remove index tag(s) on serverless index', async () => {
      const description = await pinecone.indexes.describe(serverlessIndexName);
      expect(description.tags).toEqual({
        project: 'pinecone-integration-tests',
      });

      // Add a tag
      await pinecone.indexes.configure(serverlessIndexName, {
        tags: { testTag: 'testValue' },
      });
      const description2 = await pinecone.indexes.describe(serverlessIndexName);
      expect(description2.tags).toEqual({
        project: 'pinecone-integration-tests',
        testTag: 'testValue',
      });

      // Remove that tag
      await pinecone.indexes.configure(serverlessIndexName, {
        tags: { testTag: '' }, // Passing null/undefined here is not allowed due to type safety (must eval to string)
      });
      const description3 = await pinecone.indexes.describe(serverlessIndexName);
      if (description3.tags != null) {
        expect(description3.tags['testTag']).toBeUndefined();
        expect(description3.tags['project']).toEqual(
          'pinecone-integration-tests',
        );
      }

      // Confirm when config'ing other things about the index, tags are not changed
      await pinecone.indexes.configure(serverlessIndexName, {
        deletionProtection: 'enabled',
      });
      const description4 = await pinecone.indexes.describe(serverlessIndexName);
      if (description4.tags != null) {
        expect(description4.tags['testTag']).toBeUndefined();
        expect(description4.tags['project']).toEqual(
          'pinecone-integration-tests',
        );
      }

      // (Cleanup) Disable deletion protection
      await pinecone.indexes.configure(serverlessIndexName, {
        deletionProtection: 'disabled',
      });
    });

    test('Update a tag value in a serverless index', async () => {
      const description = await pinecone.indexes.describe(serverlessIndexName);
      expect(description.tags).toEqual({
        project: 'pinecone-integration-tests',
      });

      await pinecone.indexes.configure(serverlessIndexName, {
        tags: { project: 'updated-project' },
      });
      const description2 = await pinecone.indexes.describe(serverlessIndexName);
      if (description2.tags != null) {
        expect(description2.tags['project']).toEqual('updated-project');
      }
    });
  });
});
