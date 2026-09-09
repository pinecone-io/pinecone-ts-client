import { Index, FetchResponse, PineconeRecord } from '../../../index';
import { getTestContext } from '../../test-context';
import { assertWithRetries, randomName } from '../../test-helpers';

let index: Index;
let namespace: string;
const records: PineconeRecord[] = [
  {
    id: 'first',
    values: [1, 0],
    metadata: { group: 'selected', retained: true },
  },
  { id: 'second', values: [0.5, 0.5], metadata: { group: 'selected' } },
  { id: 'other', values: [0, 1], metadata: { group: 'other' } },
];

beforeEach(async () => {
  const fixtures = await getTestContext();
  // Mutations get their own records, independently of Jest ordering and matrix jobs.
  namespace = randomName('legacy-fetch-update');
  index = fixtures.client.index({
    name: fixtures.legacyVectors.dense.name,
    namespace,
  });
  await index.upsert({ records });
  await assertWithRetries(
    () => index.fetch({ ids: records.map((record) => record.id) }),
    (result: FetchResponse) => {
      expect(result.namespace).toBe(namespace);
      expect(Object.keys(result.records).sort()).toEqual([
        'first',
        'other',
        'second',
      ]);
      for (const record of records)
        expect(result.records[record.id]).toMatchObject(record);
    },
  );
});

describe('legacy dense fetch and update', () => {
  test('fetch returns stored values and metadata and omits unknown IDs', async () => {
    const result = await index.fetch({
      ids: ['first', 'second', 'never-upserted'],
    });
    expect(result.namespace).toBe(namespace);
    expect(Object.keys(result.records).sort()).toEqual(['first', 'second']);
    expect(result.records.first).toMatchObject(records[0]);
    expect(result.records.second).toMatchObject(records[1]);
    const missing = await index.fetch({ ids: ['never-upserted'] });
    expect(missing.records).toEqual({});
  });

  test('upsert replaces an existing record', async () => {
    const replacement = {
      id: 'first',
      values: [0.25, 0.75],
      metadata: { replaced: true },
    };
    await index.upsert({ records: [replacement] });
    await assertWithRetries(
      () => index.fetch({ ids: ['first', 'second'] }),
      (result: FetchResponse) => {
        expect(result.records.first).toMatchObject(replacement);
        expect(result.records.first.metadata).toEqual(replacement.metadata);
        expect(result.records.second).toMatchObject(records[1]);
      },
    );
  });

  test('update changes values and merges metadata on one record', async () => {
    await index.update({
      id: 'first',
      values: [0.25, 0.75],
      metadata: { changed: true },
    });
    await assertWithRetries(
      () => index.fetch({ ids: ['first', 'second'] }),
      (result: FetchResponse) => {
        expect(result.records.first.values).toEqual([0.25, 0.75]);
        expect(result.records.first.metadata).toEqual({
          ...records[0].metadata,
          changed: true,
        });
        expect(result.records.second).toMatchObject(records[1]);
      },
    );
  });

  test('metadata-only update preserves vector values', async () => {
    await index.update({ id: 'first', metadata: { group: 'updated' } });
    await assertWithRetries(
      () => index.fetch({ ids: ['first'] }),
      (result: FetchResponse) => {
        expect(result.records.first.values).toEqual(records[0].values);
        expect(result.records.first.metadata).toEqual({
          group: 'updated',
          retained: true,
        });
      },
    );
  });

  test('update by filter changes only matching records', async () => {
    // Fetch visibility can precede metadata indexing; verify the filter is ready
    // before making the single update request whose effects this test checks.
    await assertWithRetries(
      () => index.fetchByMetadata({ filter: { group: { $eq: 'selected' } } }),
      (result: FetchResponse) => {
        expect(Object.keys(result.records).sort()).toEqual(['first', 'second']);
      },
    );
    await index.update({
      filter: { group: { $eq: 'selected' } },
      metadata: { changed: true },
    });
    await assertWithRetries(
      () => index.fetch({ ids: ['first', 'second', 'other'] }),
      (result: FetchResponse) => {
        for (const record of records.slice(0, 2)) {
          expect(result.records[record.id].values).toEqual(record.values);
          expect(result.records[record.id].metadata).toEqual({
            ...record.metadata,
            changed: true,
          });
        }
        expect(result.records.other).toMatchObject(records[2]);
        expect(result.records.other.metadata).toEqual(records[2].metadata);
      },
    );
  });

  test('fetchByMetadata returns matching records with values and metadata', async () => {
    await assertWithRetries(
      () =>
        index.fetchByMetadata({
          filter: { group: { $eq: 'selected' } },
          limit: 10,
        }),
      (result: FetchResponse) => {
        expect(result.namespace).toBe(namespace);
        expect(Object.keys(result.records).sort()).toEqual(['first', 'second']);
        expect(result.records.first).toMatchObject(records[0]);
        expect(result.records.second).toMatchObject(records[1]);
      },
    );
    const empty = await index.fetchByMetadata({
      filter: { group: { $eq: 'missing' } },
    });
    expect(empty.records).toEqual({});
  });
});
