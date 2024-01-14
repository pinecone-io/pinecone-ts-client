import { PineconeNotFoundError } from '../../errors';
import { Pinecone } from '../../index';
import { randomIndexName } from '../test-helpers';

describe('describe index', () => {
  let indexName;
  let pinecone: Pinecone;

  describe('happy path', () => {
    beforeEach(async () => {
      indexName = randomIndexName('describeIndex');
      pinecone = new Pinecone();

      await pinecone.createIndex({
        name: indexName,
        dimension: 5,
        metric: 'cosine',
        spec: {
          serverless: {
            region: 'us-west-2',
            cloud: 'aws',
          },
        },
        waitUntilReady: true,
      });
    });

    afterEach(async () => {
      await pinecone.deleteIndex(indexName);
    });

    test('describe index', async () => {
      const description = await pinecone.describeIndex(indexName);
      expect(description.name).toEqual(indexName);
      expect(description.dimension).toEqual(5);
      expect(description.metric).toEqual('cosine');
      expect(description.host).toBeDefined();
      expect(description.spec.serverless).toBeDefined();
      expect(description.spec.serverless?.cloud).toEqual('aws');
      expect(description.spec.serverless?.region).toEqual('us-west-2');
      expect(description.status.ready).toEqual(true);
      expect(description.status.state).toEqual('Ready');
    });
  });

  describe('error case', () => {
    test('describe index with invalid index name', async () => {
      expect.assertions(1);
      try {
        return await pinecone.describeIndex('non-existent-index');
      } catch (e) {
        const err = e as PineconeNotFoundError;
        expect(err.name).toEqual('PineconeNotFoundError');
      }
    });
  });
});
