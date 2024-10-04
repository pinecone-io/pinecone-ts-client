import { Pinecone, Index } from '../../index';
import {
  generateRecords,
  waitUntilRecordsReady,
  globalNamespaceOne,
  randomIndexName,
  sleep,
} from '../test-helpers';

let pinecone: Pinecone,
  // todo: add pods
  serverlessIndex: Index,
  serverlessIndexName: string,
  recordIds: string[];

beforeAll(async () => {
  // todo: add pods
  pinecone = new Pinecone();
  serverlessIndexName = randomIndexName(
    'integration-test-serverless-upsert-update'
  );

  await pinecone.createIndex({
    name: serverlessIndexName,
    dimension: 2,
    metric: 'cosine',
    spec: {
      serverless: {
        region: 'us-west-2',
        cloud: 'aws',
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
});

afterAll(async () => {
  await pinecone.deleteIndex(serverlessIndexName);
  // todo: add pods
});

// todo: add sparse values update
describe('upsert and update to serverless index', () => {
  test.skip('Skip until latency is figured out', async () => {
    test('verify upsert and update', async () => {
      const recordToUpsert = generateRecords({
        dimension: 2,
        quantity: 1,
        withSparseValues: false,
        withMetadata: true,
      });
      recordIds = recordToUpsert.map((r) => r.id);
      const oldMetadata = recordToUpsert['0'].metadata;
      expect(recordToUpsert).toHaveLength(1);
      expect(recordToUpsert[0].id).toEqual('0');

      await serverlessIndex.upsert(recordToUpsert);
      await waitUntilRecordsReady(
        serverlessIndex,
        globalNamespaceOne,
        recordIds
      );
      await sleep(7000);

      // Update vector values and metadata
      const newValues = [0.5, 0.4];
      const newMetadata = { flavor: 'chocolate' };

      await serverlessIndex.update({
        id: '0',
        values: newValues,
        metadata: newMetadata,
      });
      await sleep(15000);

      const postUpdateAssertions = (response) => {
        expect(response.records['0'].values).toEqual(newValues);
        expect(response.records['0'].metadata).toEqual({
          ...oldMetadata,
          ...newMetadata,
        });
      };

      postUpdateAssertions(await serverlessIndex.fetch(['0']));
    });
  });
});
