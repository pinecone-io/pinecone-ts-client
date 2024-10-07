import { Pinecone, Index } from '../../index';
import {
  generateRecords,
  waitUntilRecordsReady,
  globalNamespaceOne,
  randomIndexName,
} from '../test-helpers';

// todo: deleting non-existent records
// todo: delete all records in namespace
// todo: delete namespace
// todo: delete index (?)

let pinecone: Pinecone,
  serverlessIndexName: string,
  serverlessIndex: Index,
  recordIds: string[];

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndexName = randomIndexName('integration-test-serverless-delete');

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

describe('delete', () => {
  test('verify delete with an id', async () => {
    // Await record freshness, and check record upserted
    await waitUntilRecordsReady(serverlessIndex, globalNamespaceOne, recordIds);

    const deleteSpy = jest
      .spyOn(serverlessIndex, 'deleteOne')
      .mockResolvedValue(undefined);
    await serverlessIndex.deleteOne(recordIds[0]);
    expect(deleteSpy).toHaveBeenCalledWith(recordIds[0]);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  test('verify deleteMany with multiple ids', async () => {
    const deleteManySpy = jest
      .spyOn(serverlessIndex, 'deleteMany')
      .mockResolvedValue(undefined);
    await serverlessIndex.deleteMany(recordIds.slice(1, 3));
    expect(deleteManySpy).toHaveBeenCalledWith(recordIds.slice(1, 3));
    expect(deleteManySpy).toHaveBeenCalledTimes(1);
    deleteManySpy.mockRestore();
  });
});
