import { Pinecone, Index } from '../../../index';
import {
  assertWithRetries,
  randomString,
  generateRecords,
  INDEX_NAME,
  waitUntilRecordsReady,
} from '../../test-helpers';

describe('upsert and update', () => {
  let pinecone: Pinecone,
    index: Index,
    ns: Index,
    namespace: string,
    recordIds: string[];

  beforeEach(async () => {
    pinecone = new Pinecone();

    await pinecone.createIndex({
      name: INDEX_NAME,
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

    namespace = randomString(16);
    index = pinecone.index(INDEX_NAME);
    ns = index.namespace(namespace);
  });

  afterEach(async () => {
    await ns.deleteMany(recordIds);
  });

  test('verify upsert and update', async () => {
    const recordToUpsert = generateRecords({
      dimension: 5,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });

    // Upsert record
    await serverlessIndex.upsert(recordToUpsert);

    // Build new values
    const newValues = [0.5, 0.4];
    const newMetadata = { flavor: 'chocolate' };

    const updateSpy = jest
      .spyOn(serverlessIndex, 'update')
      .mockResolvedValue(undefined);

    // Update values w/new values
    await serverlessIndex.update({
      id: '0',
      values: newValues,
      metadata: newMetadata,
    });

    expect(updateSpy).toHaveBeenCalledWith({
      id: '0',
      values: newValues,
      metadata: newMetadata,
    });

    // Clean up spy after the test
    updateSpy.mockRestore();
  });
});
