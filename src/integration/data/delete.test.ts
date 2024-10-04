import { Pinecone, Index } from '../../index';
import {
  generateRecords,
  waitUntilRecordsReady,
  globalNamespaceOne,
  sleep,
} from '../test-helpers';

let pinecone: Pinecone,
  serverlessIndexName: string,
  serverlessIndex: Index,
  recordIds: string[];

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndexName = 'integration-test-serverless-delete';

  await pinecone.createIndex({
    name: serverlessIndexName,
    dimension: 5,
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

  // Seed index
  const recordsToUpsert = generateRecords({ dimension: 5, quantity: 5 });
  recordIds = recordsToUpsert.map((r) => r.id);
  await serverlessIndex.upsert(recordsToUpsert);
});

afterAll(async () => {
  await pinecone.deleteIndex(serverlessIndexName);
});

// todo: deleting non-existent records
// todo: delete all records in namespace
// todo: delete namespace
// todo: delete index (?)

describe('delete', () => {
  test('verify delete with an id', async () => {
    // Await record freshness, and check record upserted
    await waitUntilRecordsReady(serverlessIndex, globalNamespaceOne, recordIds);

    // Try deleting the record
    await serverlessIndex.deleteOne(recordIds[0]);

    // Verify the record is removed
    const deleteAssertions = (stats) => {
      expect(stats.namespaces[globalNamespaceOne].recordCount).toEqual(4);
    };

    deleteAssertions(await serverlessIndex.describeIndexStats());
  });

  test('verify deleteMany with multiple ids', async () => {
    // Try deleting 2 of 4 records (note: ID '0' was deleted in previous test)
    await serverlessIndex.deleteMany(recordIds.slice(1, 3));

    await sleep(19000);

    const deleteAssertions = (stats) => {
      if (stats.namespaces) {
        expect(stats.namespaces[globalNamespaceOne].recordCount).toEqual(2);
      } else {
        fail(
          `Expected 2 records in the namespace: ${globalNamespaceOne}, but found ${stats.namespaces[globalNamespaceOne].recordCount}`
        );
      }
    };

    deleteAssertions(await serverlessIndex.describeIndexStats());
  });
});
