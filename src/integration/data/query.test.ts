import { Pinecone, Index } from '../../index';
import {
  randomString,
  generateRecords,
  INDEX_NAME,
  sleep,
  waitUntilRecordsReady,
} from '../test-helpers';

describe('query', () => {
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

  test('query by id', async () => {
    const recordsToUpsert = generateRecords(5, 3);
    recordIds = recordsToUpsert.map((r) => r.id);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);

    const topK = 2;
    const results = await ns.query({ id: '0', topK });
    expect(results.matches).toBeDefined();

    expect(results.matches?.length).toEqual(topK);
  });

  test('query when topK is greater than number of records', async () => {
    const numberOfRecords = 3;
    const recordsToUpsert = generateRecords(5, numberOfRecords);
    recordIds = recordsToUpsert.map((r) => r.id);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);

    const topK = 5;
    const results = await ns.query({ id: '0', topK });
    console.log('Query Results: ', results);
    expect(results.matches).toBeDefined();

    expect(results.matches?.length).toEqual(numberOfRecords);
  });

  test('with invalid id, returns empty results', async () => {
    const recordsToUpsert = generateRecords(5, 3);
    recordIds = recordsToUpsert.map((r) => r.id);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);

    const topK = 2;
    const results = await ns.query({ id: '100', topK });
    expect(results.matches).toBeDefined();

    expect(results.matches?.length).toEqual(0);
  });

  test('query with vector values', async () => {
    const numberOfRecords = 3;
    const recordsToUpsert = generateRecords(5, numberOfRecords);
    recordIds = recordsToUpsert.map((r) => r.id);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);
    await waitUntilRecordsReady(ns, namespace, recordIds);

    const topK = 1;
    const results = await ns.query({
      vector: [0.11, 0.22, 0.33, 0.44, 0.55],
      topK,
    });
    expect(results.matches).toBeDefined();
    expect(results.matches?.length).toEqual(topK);
  });
});
