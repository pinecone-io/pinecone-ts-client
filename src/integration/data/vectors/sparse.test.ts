import {
  Index,
  QueryOptions,
  QueryResponse,
  FetchResponse,
  PineconeRecord,
} from '../../../index';
import { getTestContext } from '../../test-context';
import { assertWithRetries, randomName } from '../../test-helpers';

let index: Index;
let namespace: string;
const records: PineconeRecord[] = [
  {
    id: 'first',
    sparseValues: { indices: [1, 3], values: [1, 0.5] },
    metadata: { group: 'selected' },
  },
  {
    id: 'second',
    sparseValues: { indices: [1, 5], values: [0.5, 1] },
    metadata: { group: 'other' },
  },
];
// QueryOptions currently requires a dense `vector` even for sparse-only queries.
// The runtime and sparse vectors endpoint accept sparseVector without it.
const sparseQuery = (
  includeValues = true,
  includeMetadata = true,
): QueryOptions =>
  ({
    topK: 2,
    sparseVector: { indices: [1, 3], values: [1, 0.5] },
    includeValues,
    includeMetadata,
  }) as QueryOptions;

beforeAll(async () => {
  const fixtures = await getTestContext();
  namespace = randomName('legacy-sparse');
  index = fixtures.client.index({
    name: fixtures.legacyVectors.sparse.name,
    namespace,
  });
  await index.upsert({ records });
  await assertWithRetries(
    () => index.query(sparseQuery()),
    (result: QueryResponse) => {
      expect(result.matches.map((match) => match.id)).toEqual([
        'first',
        'second',
      ]);
    },
  );
});

describe('legacy sparse vectors', () => {
  test('upsert and fetch preserve sparse values and metadata', async () => {
    await assertWithRetries(
      () => index.fetch({ ids: ['first', 'second'] }),
      (result: FetchResponse) => {
        expect(result.namespace).toBe(namespace);
        expect(Object.keys(result.records).sort()).toEqual(['first', 'second']);
        for (const record of records)
          expect(result.records[record.id]).toMatchObject(record);
      },
    );
  });

  test('query ranks sparse vectors and returns requested projections', async () => {
    const result = await index.query(sparseQuery());
    expect(result.namespace).toBe(namespace);
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toMatchObject(records[0]);
    expect(result.matches[1]).toMatchObject(records[1]);
    expect(result.matches[0].score).toBeCloseTo(1.25);
    expect(result.matches[1].score).toBeCloseTo(0.5);
  });

  test('query filters sparse candidates', async () => {
    await assertWithRetries(
      () =>
        index.query({
          ...sparseQuery(),
          filter: { group: { $eq: 'selected' } },
        }),
      (result: QueryResponse) => {
        expect(result.matches).toHaveLength(1);
        expect(result.matches[0]).toMatchObject(records[0]);
      },
    );
  });
});
