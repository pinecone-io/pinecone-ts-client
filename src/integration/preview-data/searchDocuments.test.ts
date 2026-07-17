import { Pinecone } from '../../index';
import { randomName, assertWithRetries } from '../test-helpers';

let pc: Pinecone;
let indexName: string;
const namespace = 'test-ns';

beforeAll(async () => {
  pc = new Pinecone();
  indexName = randomName('preview-search-docs');

  await pc.preview.indexes.create({
    name: indexName,
    schema: {
      fields: {
        content: { type: 'string', fullTextSearch: {} },
      },
    },
    waitUntilReady: true,
  });

  await pc.preview.index({ name: indexName }).upsertDocuments(namespace, {
    documents: [
      {
        _id: 'doc-1',
        content: 'Machine learning is fascinating',
        title: 'ML Doc',
      },
      {
        _id: 'doc-2',
        content: 'Vector databases enable semantic search',
        title: 'VDB Doc',
      },
    ],
  });

  // Poll until the upserted documents are retrievable before searching
  await assertWithRetries(
    () =>
      pc.preview
        .index({ name: indexName })
        .fetchDocuments(namespace, { ids: ['doc-1', 'doc-2'] }),
    (result) => {
      expect(result.documents['doc-1']).toBeDefined();
      expect(result.documents['doc-2']).toBeDefined();
    },
  );
}, 300000);

afterAll(async () => {
  try {
    await pc.preview.indexes.delete(indexName);
  } finally {
    // cleanup attempt completed
  }
});

describe('preview searchDocuments', () => {
  test('returns matches, namespace, and usage from search', async () => {
    const result = await pc.preview
      .index({ name: indexName })
      .searchDocuments(namespace, {
        scoreBy: [
          { type: 'text', field: 'content', query: 'machine learning' },
        ],
        topK: 5,
      });

    expect(Array.isArray(result.matches)).toBe(true);
    expect(result.namespace).toBe(namespace);
    expect(result.usage.readUnits).toBeGreaterThanOrEqual(0);
  });
});
