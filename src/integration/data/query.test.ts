import { Pinecone, Index } from '../../index';
import { randomString, generateRecords } from '../test-helpers';

// TODO: Un-skip when freshness layer is ready
describe.skip('query', () => {
  const INDEX_NAME = 'ts-integration';
  let pinecone: Pinecone, index: Index, ns: Index, namespace: string;

  beforeEach(async () => {
    pinecone = new Pinecone();

    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 5,
      metric: 'cosine',
      spec: {
        pod: {
          environment: 'us-west1-gcp',
          replicas: 1,
          shards: 1,
          podType: 'p1.x1',
          pods: 1,
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
    await ns.deleteAll();
  });

  test.skip('query by id', async () => {
    const recordsToUpsert = generateRecords(5, 3);
    expect(recordsToUpsert).toHaveLength(3);

    // These assertions are just to show what ids were
    // used in the generated records
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);

    const topK = 2;
    const results = await ns.query({ id: '0', topK });
    expect(results.matches).toBeDefined();

    expect(results.matches?.length).toEqual(topK);
  });

  test.skip('query when topK is greater than number of records', async () => {
    const numberOfRecords = 3;
    const recordsToUpsert = generateRecords(5, numberOfRecords);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);

    const topK = 5;
    const results = await ns.query({ id: '0', topK });
    expect(results.matches).toBeDefined();

    expect(results.matches?.length).toEqual(numberOfRecords);
  });

  test.skip('with invalid id, returns empty results', async () => {
    const recordsToUpsert = generateRecords(5, 3);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);

    const topK = 2;
    const results = await ns.query({ id: '100', topK });
    expect(results.matches).toBeDefined();

    expect(results.matches?.length).toEqual(0);
  });

  test.skip('query with vector values', async () => {
    const numberOfRecords = 3;
    const recordsToUpsert = generateRecords(5, numberOfRecords);
    expect(recordsToUpsert).toHaveLength(3);
    expect(recordsToUpsert[0].id).toEqual('0');
    expect(recordsToUpsert[1].id).toEqual('1');
    expect(recordsToUpsert[2].id).toEqual('2');

    await ns.upsert(recordsToUpsert);

    const topK = 1;
    const results = await ns.query({
      vector: [0.11, 0.22, 0.33, 0.44, 0.55],
      topK,
    });
    expect(results.matches).toBeDefined();
    expect(results.matches?.length).toEqual(topK);
  });
});
