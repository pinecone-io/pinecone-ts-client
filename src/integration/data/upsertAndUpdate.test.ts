import { Pinecone, Index } from '../../index';
import {
  randomString,
  generateRecords,
  INDEX_NAME,
  sleep,
  waitUntilRecordsReady,
} from '../test-helpers';

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
    const recordToUpsert = generateRecords(5, 1, false, true);
    recordIds = recordToUpsert.map((r) => r.id);
    expect(recordToUpsert).toHaveLength(1);
    expect(recordToUpsert[0].id).toEqual('0');

    await ns.upsert(recordToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);
    // await sleep(1500);

    // Fetch and inspect records to validate upsert
    const fetchResult = await ns.fetch(recordIds);
    const records = fetchResult.records;
    if (records) {
      expect(records['0']).toBeDefined();
      expect(records['0'].values).toEqual(recordToUpsert[0].values);
      expect(records['0'].metadata).toEqual(recordToUpsert[0].metadata);
    } else {
      fail(
        'Did not find expected records. Fetch result was ' +
          JSON.stringify(fetchResult)
      );
    }

    const oldMetadata = records['0'].metadata;

    // Update record values
    const newValues = [0.5, 0.4, 0.3, 0.2, 0.1];
    const newMetadata = { flavor: 'chocolate' };
    await ns.update({
      id: '0',
      values: newValues,
      metadata: newMetadata,
    });
    await sleep(3000);

    // Fetch and validate update
    const updatedFetchResult = await ns.fetch(['0']);
    if (Object.keys(updatedFetchResult.records).length > 0) {
      const updatedRecord = updatedFetchResult.records['0'];
      expect(updatedRecord.values).toEqual(newValues);
      expect(updatedRecord.metadata).toEqual({
        ...oldMetadata,
        ...newMetadata,
      });
    } else {
      fail(
        'Did not find expected updated record. Fetch result was ' +
          JSON.stringify(updatedFetchResult)
      );
    }
  });
});
