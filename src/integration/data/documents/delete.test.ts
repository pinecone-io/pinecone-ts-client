import { Pinecone, Index } from '../../../index';
import {
  generateDocuments,
  waitUntilRecordsReady,
  globalNamespaceOne,
  randomName,
  vectorFieldName,
  waitUntilIndexReady,
} from '../../test-helpers';

let pinecone: Pinecone,
  serverlessIndexName: string,
  serverlessIndex: Index,
  recordIds: string[];

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndexName = randomName('integration-test-serverless-delete');

  await pinecone.indexes.create({
    name: serverlessIndexName,
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-west-2',
    },
    schema: {
      fields: {
        [vectorFieldName]: {
          type: 'dense_vector',
          dimension: 5,
          metric: 'cosine',
        },
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  serverlessIndex = pinecone.index({
    name: serverlessIndexName,
    namespace: globalNamespaceOne,
  });

  // Seed index
  const documentsToUpsert = generateDocuments({ dimension: 5, quantity: 5 });
  recordIds = documentsToUpsert.map((d) => d._id);
  await serverlessIndex.upsertDocuments({ documents: documentsToUpsert });
});

afterAll(async () => {
  await waitUntilIndexReady(serverlessIndexName);
  await pinecone.indexes.delete(serverlessIndexName);
});

// `deleteOne`, `deleteMany`, and `deleteAll` collapse into a single
// `deleteDocuments` accepting `ids`, `filter`, or `deleteAll`.
describe('deleteDocuments', () => {
  test('verify delete with an id', async () => {
    // Await record freshness, and check documents upserted
    await waitUntilRecordsReady(serverlessIndex, globalNamespaceOne, recordIds);

    const deleteSpy = jest
      .spyOn(serverlessIndex, 'deleteDocuments')
      .mockResolvedValue(undefined);
    await serverlessIndex.deleteDocuments({ ids: [recordIds[0]] });
    expect(deleteSpy).toHaveBeenCalledWith({ ids: [recordIds[0]] });
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    deleteSpy.mockRestore();
  });

  test('verify delete with multiple ids', async () => {
    const deleteManySpy = jest
      .spyOn(serverlessIndex, 'deleteDocuments')
      .mockResolvedValue(undefined);
    await serverlessIndex.deleteDocuments({ ids: recordIds.slice(1, 3) });
    expect(deleteManySpy).toHaveBeenCalledWith({ ids: recordIds.slice(1, 3) });
    expect(deleteManySpy).toHaveBeenCalledTimes(1);
    deleteManySpy.mockRestore();
  });
});
