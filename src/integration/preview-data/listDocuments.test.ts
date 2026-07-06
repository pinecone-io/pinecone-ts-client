import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;
let indexName: string;
const namespace = 'test-ns';

beforeAll(async () => {
  pc = new Pinecone();
  indexName = randomName('preview-list-docs');

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
      { _id: 'doc-1', content: 'Machine learning' },
      { _id: 'doc-2', content: 'Vector databases' },
      { _id: 'other-1', content: 'Something else' },
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

describe('preview listDocuments', () => {
  test('lists all documents in the namespace with namespace and usage', async () => {
    const result = await pc.preview
      .index({ name: indexName })
      .listDocuments(namespace);

    expect(result.documents.length).toBeGreaterThanOrEqual(3);
    expect(result.namespace).toBe(namespace);
    expect(result.usage.readUnits).toBeGreaterThanOrEqual(0);
  });

  test('filters documents by ID prefix', async () => {
    const result = await pc.preview
      .index({ name: indexName })
      .listDocuments(namespace, { prefix: 'doc-' });

    expect(result.documents.length).toBe(2);
    result.documents.forEach((doc) => {
      expect(doc.id.startsWith('doc-')).toBe(true);
    });
  });

  test('respects limit and returns a pagination token when more remain', async () => {
    const firstPage = await pc.preview
      .index({ name: indexName })
      .listDocuments(namespace, { limit: 1 });

    expect(firstPage.documents.length).toBe(1);
    expect(firstPage.pagination?.next).toBeDefined();

    const secondPage = await pc.preview
      .index({ name: indexName })
      .listDocuments(namespace, {
        limit: 1,
        paginationToken: firstPage.pagination?.next,
      });

    expect(secondPage.documents.length).toBe(1);
    expect(secondPage.documents[0].id).not.toBe(firstPage.documents[0].id);
  });
});
