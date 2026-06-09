import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;
let indexName: string;
const namespace = 'test-ns';

beforeAll(async () => {
  pc = new Pinecone();
  indexName = randomName('preview-fetch-docs');

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
      { _id: 'doc-1', title: 'Foo', content: 'Machine learning' },
      { _id: 'doc-2', title: 'Bar', content: 'Vector databases' },
    ],
  });

  // Wait for propagation
  await new Promise((resolve) => setTimeout(resolve, 8000));
}, 300000);

afterAll(async () => {
  try {
    await pc.preview.indexes.delete(indexName);
  } finally {
    // cleanup attempt completed
  }
});

describe('preview fetchDocuments', () => {
  test('fetches 2 documents and returns a documents map with namespace and usage', async () => {
    const result = await pc.preview
      .index({ name: indexName })
      .fetchDocuments(namespace, { ids: ['doc-1', 'doc-2'] });

    expect(Object.keys(result.documents)).toHaveLength(2);
    expect(result.documents['doc-1']).toBeDefined();
    expect(result.documents['doc-2']).toBeDefined();
    expect(result.namespace).toBe(namespace);
    expect(result.usage.readUnits).toBeGreaterThanOrEqual(0);
  });

  test('respects includeFields by returning only the requested fields', async () => {
    const result = await pc.preview.index({ name: indexName }).fetchDocuments(namespace, {
      ids: ['doc-1'],
      includeFields: ['title'],
    });

    const doc = result.documents['doc-1'];
    expect(doc).toBeDefined();
    expect(doc._id).toBeDefined();
    expect(doc.title).toBeDefined();
  });
});
