import { Pinecone, Index } from '../../index';
import {
  generateRecords,
  randomString,
  INDEX_NAME,
  waitUntilRecordsReady,
} from '../test-helpers';

describe('fetch', () => {
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
    recordIds = [];
  });

  afterEach(async () => {
    await ns.deleteMany(recordIds);
  });

  test('fetch by id', async () => {
    const recordsToUpsert = generateRecords(5, 3);
    recordIds = recordsToUpsert.map((r) => r.id);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);

    const results = await ns.fetch(['0', '1', '2']);
    expect(results.records['0']).toBeDefined();
    expect(results.records['1']).toBeDefined();
    expect(results.records['2']).toBeDefined();
  });
});
