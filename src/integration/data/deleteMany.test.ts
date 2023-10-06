import { Pinecone, Index } from '../../index';
import { randomString, generateRecords } from '../test-helpers';

describe('deleteMany', () => {
  const INDEX_NAME = 'ts-integration';
  let pinecone: Pinecone, index: Index, ns: Index, namespace: string;

  beforeEach(async () => {
    pinecone = new Pinecone();

    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 5,
      waitUntilReady: true,
      suppressConflicts: true,
    });

    namespace = randomString(16);
    index = pinecone.index(INDEX_NAME);
    ns = index.namespace(namespace);
  });

  afterAll(async () => {
    await pinecone.listIndexes();
    await ns.deleteAll();
  });

  test('verify deleteMany with ids', async () => {
    const recordsToUpsert = generateRecords(5, 3);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);

    // Check records got upserted
    let stats = await ns.describeIndexStats();
    if (stats.namespaces) {
      expect(stats.namespaces[namespace].recordCount).toEqual(3);
    } else {
      fail('Expected namespaces to be defined');
    }

    // Look more closely at one of the records to make sure values set
    const fetchResult = await ns.fetch(['0']);
    const records = fetchResult.records;
    if (records) {
      expect(records['0'].id).toEqual('0');
      expect(records['0'].values.length).toEqual(5);
    } else {
      fail(
        'Did not find expected records. Fetch result was ' +
          JSON.stringify(fetchResult)
      );
    }

    // Try deleting 2 of 3 vectors
    await ns.deleteMany(['0', '2']);
    stats = await ns.describeIndexStats();
    if (stats.namespaces) {
      expect(stats.namespaces[namespace].recordCount).toEqual(1);
    } else {
      fail(
        'Expected namespaces to be defined (second call). Stats were ' +
          JSON.stringify(stats)
      );
    }

    // Check that record id='1' still exists
    const fetchResult2 = await ns.fetch(['1']);
    const records2 = fetchResult2.records;
    if (records2) {
      expect(records2['1']).not.toBeUndefined();
    } else {
      fail(
        'Expected record 2 to be defined. Fetch result was ' +
          JSON.stringify(fetchResult2)
      );
    }

    // deleting non-existent indexes should not throw
    await ns.deleteMany(['0', '1', '2', '3']);

    // Verify all are now removed
    stats = await ns.describeIndexStats();
    if (stats.namespaces) {
      expect(stats.namespaces[namespace]).toBeUndefined();
    } else {
      // no-op. This should actually happen unless there
      // are leftover namespaces from previous runs that
      // failed or stopped without proper cleanup.
    }
  });
});
