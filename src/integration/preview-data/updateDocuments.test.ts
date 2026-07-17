import { Pinecone } from '../../index';
import { randomName, assertWithRetries } from '../test-helpers';

let pc: Pinecone;
let indexName: string;
const namespace = 'test-ns';

beforeAll(async () => {
  pc = new Pinecone();
  indexName = randomName('preview-update-docs');

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
      { _id: 'doc-1', title: 'Original title', content: 'Machine learning' },
    ],
  });

  // Poll until the upserted document is retrievable
  await assertWithRetries(
    () =>
      pc.preview
        .index({ name: indexName })
        .fetchDocuments(namespace, { ids: ['doc-1'] }),
    (result) => {
      expect(result.documents['doc-1']).toBeDefined();
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

describe('preview updateDocuments', () => {
  test('applies a partial field update and removes a field', async () => {
    await pc.preview.index({ name: indexName }).updateDocuments(namespace, {
      documents: [
        { _id: 'doc-1', content: 'Updated content', _remove_fields: ['title'] },
      ],
    });

    // Poll until the update has propagated
    await assertWithRetries(
      () =>
        pc.preview
          .index({ name: indexName })
          .fetchDocuments(namespace, { ids: ['doc-1'] }),
      (result) => {
        const doc = result.documents['doc-1'];
        expect(doc).toBeDefined();
        expect(doc.content).toBe('Updated content');
        expect(doc.title).toBeUndefined();
      },
    );
  });
});
