import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;
let indexName: string;
const namespace = 'test-ns';

beforeAll(async () => {
  pc = new Pinecone();
  indexName = randomName('preview-search-docs');

  await pc.preview.indexes.createIndex({
    name: indexName,
    schema: {
      fields: {
        content: { type: 'string', full_text_search: {} },
      },
    },
    waitUntilReady: true,
  });

  await pc.preview.index(indexName).upsertDocuments(namespace, {
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

  // Wait for propagation
  await new Promise((resolve) => setTimeout(resolve, 8000));
}, 300000);

afterAll(async () => {
  try {
    await pc.preview.indexes.deleteIndex(indexName);
  } finally {
    // cleanup attempt completed
  }
});

describe('preview searchDocuments', () => {
  test('returns matches, namespace, and usage from search', async () => {
    const result = await pc.preview
      .index(indexName)
      .searchDocuments(namespace, {
        score_by: [
          { type: 'text', field: 'content', query: 'machine learning' },
        ],
        top_k: 5,
      });

    expect(Array.isArray(result.matches)).toBe(true);
    expect(result.namespace).toBe(namespace);
    expect(result.usage.read_units).toBeGreaterThanOrEqual(0);
  });
});
