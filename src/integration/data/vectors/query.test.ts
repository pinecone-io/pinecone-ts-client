import { Index, QueryResponse, PineconeRecord } from '../../../index';
import { getTestContext } from '../../test-context';
import { assertWithRetries, randomName } from '../../test-helpers';

let index: Index;
let namespace: string;
const records: PineconeRecord[] = [
  { id: 'first', values: [1, 0], metadata: { group: 'selected', rank: 1 } },
  {
    id: 'second',
    values: [0.5, 0.5],
    metadata: { group: 'selected', rank: 2 },
  },
  { id: 'other', values: [0, 1], metadata: { group: 'other', rank: 3 } },
];

beforeAll(async () => {
  const fixtures = await getTestContext();
  // CI shares indexes across matrix jobs. Each suite/run owns its namespace.
  namespace = randomName('legacy-query');
  index = fixtures.client.index({
    name: fixtures.legacyVectors.dense.name,
    namespace,
  });
  await index.upsert({ records });
  await assertWithRetries(
    () => index.query({ vector: [1, 0], topK: 3 }),
    (result: QueryResponse) => {
      expect(result.matches.map((match) => match.id).sort()).toEqual(
        records.map((record) => record.id).sort(),
      );
    },
  );
});

describe('legacy dense query', () => {
  test('returns topK matches ordered by dotproduct score', async () => {
    const result = await index.query({ vector: [1, 0], topK: 2 });
    expect(result.namespace).toBe(namespace);
    expect(result.matches.map((match) => match.id)).toEqual([
      'first',
      'second',
    ]);
    expect(result.matches[0].score).toBeCloseTo(1);
    expect(result.matches[1].score).toBeCloseTo(0.5);
  });

  test.each([false, true])(
    'query by ID with values and metadata projections enabled: %s',
    async (include) => {
      const result = await index.query({
        id: 'first',
        topK: 1,
        includeValues: include,
        includeMetadata: include,
      });
      expect(result.namespace).toBe(namespace);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].id).toBe('first');
      expect(result.matches[0].score).toBeCloseTo(1);
      if (include) {
        expect(result.matches[0].values).toEqual(records[0].values);
        expect(result.matches[0].metadata).toEqual(records[0].metadata);
      } else {
        // The wire API can represent omitted vector values as an empty array.
        expect(result.matches[0].values ?? []).toEqual([]);
        expect(result.matches[0].metadata ?? {}).toEqual({});
      }
    },
  );

  test('filters candidates before returning results', async () => {
    await assertWithRetries(
      () =>
        index.query({
          vector: [1, 0],
          topK: 3,
          filter: { group: { $eq: 'selected' } },
          includeMetadata: true,
        }),
      (result: QueryResponse) => {
        expect(result.matches.map((match) => match.id)).toEqual([
          'first',
          'second',
        ]);
        for (const match of result.matches) {
          expect(match.metadata?.group).toBe('selected');
        }
      },
    );
  });

  test('returns no matches for a filter that selects no records', async () => {
    const result = await index.query({
      vector: [1, 0],
      topK: 3,
      filter: { group: { $eq: 'missing' } },
    });
    expect(result.matches).toEqual([]);
  });

  test('returns no matches when querying an unknown record ID', async () => {
    const result = await index.query({ id: 'never-upserted', topK: 3 });
    expect(result.matches).toEqual([]);
  });

  test('queries an empty namespace through the per-request override', async () => {
    const emptyNamespace = randomName('legacy-query-empty');
    const result = await index.query({
      vector: [1, 0],
      topK: 3,
      namespace: emptyNamespace,
    });
    expect(result.namespace).toBe(emptyNamespace);
    expect(result.matches).toEqual([]);
  });
});
