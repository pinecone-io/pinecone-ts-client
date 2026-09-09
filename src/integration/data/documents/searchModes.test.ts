import {
  Pinecone,
  Index,
  DocumentScoringMethod,
  SearchDocumentsResponse,
} from '../../../index';
import {
  assertWithRetries,
  randomName,
  retryDeletes,
} from '../../test-helpers';

const modes: {
  name: string;
  scoreBy: DocumentScoringMethod[];
  ids: string[];
}[] = [
  {
    name: 'text',
    scoreBy: [{ type: 'text', fields: ['text'], query: 'apple' }],
    ids: ['apple'],
  },
  {
    name: 'query string',
    scoreBy: [{ type: 'query_string', query: 'text:apple' }],
    ids: ['apple'],
  },
  {
    name: 'multiple text clauses',
    scoreBy: [
      { type: 'text', fields: ['text'], query: 'apple' },
      { type: 'text', fields: ['title'], query: 'orchard' },
    ],
    ids: ['apple', 'pear'],
  },
  {
    name: 'sparse vector',
    scoreBy: [
      {
        type: 'sparse_vector',
        fields: ['sparse'],
        sparseValues: { indices: [1], values: [1] },
      },
    ],
    ids: ['apple'],
  },
  {
    name: 'dense vector',
    scoreBy: [{ type: 'dense_vector', fields: ['dense'], values: [1, 0] }],
    ids: ['apple', 'car', 'pear'],
  },
];

const documents = [
  {
    _id: 'apple',
    text: 'crisp apple fruit',
    title: 'orchard',
    sparse: { indices: [1], values: [1] },
    dense: [1, 0],
    group: 'fruit',
  },
  {
    _id: 'pear',
    text: 'fresh pear fruit',
    title: 'orchard',
    sparse: { indices: [2], values: [1] },
    dense: [0, 1],
    group: 'fruit',
  },
  {
    _id: 'car',
    text: 'electric car vehicle',
    title: 'garage',
    sparse: { indices: [3], values: [1] },
    dense: [0.5, 0.5],
    group: 'vehicle',
  },
];

describe('document search scoring modes', () => {
  const pc = new Pinecone();
  const name = randomName('document-search-modes');
  const namespace = 'scoring';
  let index: Index;
  beforeAll(async () => {
    await pc.indexes.create({
      name,
      deployment: {
        deploymentType: 'managed',
        cloud: 'aws',
        region: 'us-west-2',
      },
      schema: {
        fields: {
          text: { type: 'string', fullTextSearch: {} },
          title: { type: 'string', fullTextSearch: {} },
          sparse: { type: 'sparse_vector' },
          dense: { type: 'dense_vector', dimension: 2, metric: 'dotproduct' },
        },
      },
      waitUntilReady: true,
      timeout: 180_000,
    });
    index = pc.index({ name, namespace });
    await index.upsertDocuments({ documents });
    // Fetch visibility is not search readiness. Each scoring mode must produce
    // its positive control before projection and negative tests may run.
    for (const mode of modes) {
      await assertWithRetries(
        () => index.searchDocuments({ scoreBy: mode.scoreBy, topK: 3 }),
        (result: SearchDocumentsResponse) => {
          expect(result.matches.map(({ _id }) => _id)).toEqual(mode.ids);
        },
      );
    }
  }, 1_200_000);

  afterAll(async () => {
    await retryDeletes(pc, name);
  });

  test.each(modes)(
    '$name ranks real documents and honors topK',
    async ({ scoreBy, ids }) => {
      const result = await index.searchDocuments({
        scoreBy,
        topK: 3,
        includeFields: ['*'],
      });
      expect(result.namespace).toBe(namespace);
      expect(result.usage).toBeDefined();
      expect(result.matches.map(({ _id }) => _id)).toEqual(ids);
      for (const match of result.matches) {
        expect(match).toMatchObject(
          documents.find((document) => document._id === match._id)!,
        );
        expect(match._score).toEqual(expect.any(Number));
      }
      const top = await index.searchDocuments({ scoreBy, topK: 1 });
      expect(top.matches.map(({ _id }) => _id)).toEqual([ids[0]]);
    },
  );

  test.each([
    { includeFields: undefined },
    { includeFields: [] },
    { includeFields: ['group'] },
  ])('projects only requested fields: %j', async ({ includeFields }) => {
    const result = await index.searchDocuments({
      scoreBy: modes[4].scoreBy,
      topK: 1,
      includeFields,
    });
    expect(result.matches).toHaveLength(1);
    const match = result.matches[0];
    expect(match._id).toBe('apple');
    expect(Object.keys(match).sort()).toEqual(
      includeFields?.length ? ['_id', '_score', 'group'] : ['_id', '_score'],
    );
    if (includeFields?.length) expect(match.group).toBe('fruit');
  });

  test('filters candidates with a positive control before a no-match filter', async () => {
    await assertWithRetries(
      () =>
        index.searchDocuments({
          scoreBy: modes[4].scoreBy,
          topK: 3,
          filter: { group: { $eq: 'fruit' } },
        }),
      (result: SearchDocumentsResponse) => {
        expect(result.matches.map(({ _id }) => _id)).toEqual(['apple', 'pear']);
      },
    );
    const empty = await index.searchDocuments({
      scoreBy: modes[4].scoreBy,
      topK: 3,
      filter: { group: { $eq: 'missing' } },
    });
    expect(empty.matches).toEqual([]);
  });

  test('isolates an empty namespace from the populated namespace', async () => {
    const result = await pc
      .index({ name, namespace: 'empty' })
      .searchDocuments({ scoreBy: modes[4].scoreBy, topK: 3 });
    expect(result.namespace).toBe('empty');
    expect(result.matches).toEqual([]);
  });
});
