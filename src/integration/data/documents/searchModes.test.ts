import {
  PineconeBadRequestError,
  PineconeNotFoundError,
} from '../../../errors';
import {
  Pinecone,
  Index,
  DocumentScoringMethod,
  SearchDocumentsResponse,
} from '../../../index';
import { assertWithRetries, randomName, retryDelete } from '../../test-helpers';

const denseScoreBy: DocumentScoringMethod[] = [
  { type: 'dense_vector', fields: ['dense'], values: [1, 0] },
];

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
    scoreBy: denseScoreBy,
    ids: ['apple', 'car', 'pear'],
  },
  {
    name: 'text plus query string',
    scoreBy: [
      { type: 'text', fields: ['text'], query: 'apple' },
      { type: 'query_string', query: 'title:orchard' },
    ],
    ids: ['apple', 'pear'],
  },
  {
    name: 'text across multiple fields',
    scoreBy: [
      { type: 'text', fields: ['text', 'title'], query: 'apple orchard' },
    ],
    ids: ['apple', 'pear'],
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
  }, 1_500_000);

  afterAll(async () => {
    await assertWithRetries(
      async () => {
        try {
          await pc.indexes.delete(name);
        } catch (error) {
          if (!(error instanceof PineconeNotFoundError)) throw error;
        }
      },
      () => {},
      30_000,
      1000,
    );
  });

  test('upserts documents and reports the accepted document count', async () => {
    const target = pc.index({ name, namespace: 'upsert-count' });
    const response = await target.upsertDocuments({ documents });
    expect(response.upsertedCount).toBe(documents.length);
    await assertWithRetries(
      () => target.fetchDocuments({ ids: documents.map(({ _id }) => _id) }),
      (result) => {
        expect(Object.keys(result.documents).sort()).toEqual(
          documents.map(({ _id }) => _id).sort(),
        );
      },
    );
  });

  test.each([
    { _id: 'metadata-only', group: 'fruit' },
    { _id: 'wrong-dense-type', dense: 'not a vector' },
  ])(
    'rejects a document that violates its index schema: $_id',
    async (document) => {
      await expect(
        index.upsertDocuments({ documents: [document] }),
      ).rejects.toBeInstanceOf(PineconeBadRequestError);
    },
  );

  test('rejects a vectors-plane query against a documents index', async () => {
    await expect(
      index.query({ vector: [1, 0], topK: 1 }),
    ).rejects.toBeInstanceOf(PineconeBadRequestError);
  });

  test.each([
    { includeFields: undefined },
    { includeFields: [] },
    { includeFields: ['*'] },
    { includeFields: ['group'] },
  ])(
    'fetch projection follows the fetch contract: %j',
    async ({ includeFields }) => {
      const result = await index.fetchDocuments({
        ids: ['apple'],
        includeFields,
      });
      const document = result.documents.apple;
      if (includeFields?.[0] === 'group') {
        expect(document).toEqual({ _id: 'apple', group: 'fruit' });
      } else {
        // Fetch defaults to every field; search defaults to no projected fields.
        expect(document).toEqual(documents[0]);
      }
    },
  );

  test('fetches projected documents by metadata on a multi-field schema', async () => {
    await assertWithRetries(
      () =>
        index.fetchDocuments({
          filter: { group: { $eq: 'fruit' } },
          includeFields: ['group'],
        }),
      (result) => {
        expect(result.namespace).toBe(namespace);
        expect(Object.keys(result.documents).sort()).toEqual(['apple', 'pear']);
        for (const document of Object.values(result.documents) as Array<
          Record<string, unknown>
        >) {
          expect(Object.keys(document).sort()).toEqual(['_id', 'group']);
          expect(document.group).toBe('fruit');
        }
      },
    );
    const empty = await index.fetchDocuments({
      filter: { group: { $eq: 'missing' } },
    });
    expect(empty.documents).toEqual({});
  });

  test('rejects combining vector and text clauses according to the 2026-07 contract', async () => {
    await expect(
      index.searchDocuments({
        scoreBy: [
          ...denseScoreBy,
          { type: 'text', fields: ['text'], query: 'apple' },
        ],
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(PineconeBadRequestError);
  });

  test('fetches every filtered document across distinct limit-one pages', async () => {
    const options = {
      filter: { group: { $eq: 'fruit' } },
      includeFields: ['group'],
      limit: 1,
    };
    await assertWithRetries(
      async () => {
        const first = await index.fetchDocuments(options);
        expect(Object.keys(first.documents)).toHaveLength(1);
        expect(first.pagination?.next).toEqual(expect.any(String));
        expect(first.pagination!.next!.length).toBeGreaterThan(0);
        const second = await index.fetchDocuments({
          ...options,
          paginationToken: first.pagination!.next,
        });
        expect(Object.keys(second.documents)).toHaveLength(1);
        return [first, second];
      },
      (pages) => {
        const fetched = pages.flatMap((page) => Object.values(page.documents));
        expect(fetched).toHaveLength(2);
        expect(fetched.map((document) => document._id).sort()).toEqual([
          'apple',
          'pear',
        ]);
        for (const document of fetched) {
          expect(Object.keys(document).sort()).toEqual(['_id', 'group']);
          expect(document.group).toBe('fruit');
        }
      },
    );
  });

  test('lists only the requested namespace prefix across limit-one pages', async () => {
    // Reuse this suite's private index; never add namespaces to CI's shared fixture.
    const prefix = 'pagination-';
    const names = [`${prefix}one`, `${prefix}two`];
    const failures: unknown[] = [];
    try {
      for (const name of names) await index.createNamespace({ name });
      await assertWithRetries(
        async () => {
          const first = await index.listNamespaces({ prefix, limit: 1 });
          expect(first.namespaces).toHaveLength(1);
          expect(first.pagination?.next).toEqual(expect.any(String));
          expect(first.pagination!.next!.length).toBeGreaterThan(0);
          const second = await index.listNamespaces({
            prefix,
            limit: 1,
            paginationToken: first.pagination!.next,
          });
          expect(second.namespaces).toHaveLength(1);
          return [...first.namespaces!, ...second.namespaces!];
        },
        (listed) => {
          expect(listed.map(({ name }) => name).sort()).toEqual(names);
        },
      );
    } catch (error) {
      failures.push(error);
    } finally {
      const results = await Promise.allSettled(
        names.map((name) =>
          retryDelete(() => index.deleteNamespace(name), `namespace '${name}'`),
        ),
      );
      failures.push(
        ...results.flatMap((result) =>
          result.status === 'rejected' ? [result.reason] : [],
        ),
      );
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length)
      throw new AggregateError(
        failures,
        'Namespace pagination lifecycle failed',
      );
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
      scoreBy: denseScoreBy,
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
          scoreBy: denseScoreBy,
          topK: 3,
          filter: { group: { $eq: 'fruit' } },
        }),
      (result: SearchDocumentsResponse) => {
        expect(result.matches.map(({ _id }) => _id)).toEqual(['apple', 'pear']);
      },
    );
    const empty = await index.searchDocuments({
      scoreBy: denseScoreBy,
      topK: 3,
      filter: { group: { $eq: 'missing' } },
    });
    expect(empty.matches).toEqual([]);
  });

  test('isolates an empty namespace from the populated namespace', async () => {
    const result = await pc
      .index({ name, namespace: 'empty' })
      .searchDocuments({ scoreBy: denseScoreBy, topK: 3 });
    expect(result.namespace).toBe('empty');
    expect(result.matches).toEqual([]);
  });
});
