import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;
let indexName: string;
const namespace = 'test-ns';

beforeAll(async () => {
  pc = new Pinecone();
  indexName = randomName('preview-upsert-docs');

  await pc.preview.indexes.create({
    name: indexName,
    schema: {
      fields: {
        content: { type: 'string', full_text_search: {} },
      },
    },
    waitUntilReady: true,
  });
}, 300000);

afterAll(async () => {
  try {
    await pc.preview.indexes.delete(indexName);
  } finally {
    // cleanup attempt completed
  }
});

describe('preview upsertDocuments', () => {
  test('upserts 2 documents and returns upserted_count === 2', async () => {
    const result = await pc.preview
      .index(indexName)
      .upsertDocuments(namespace, {
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

    expect(result.upserted_count).toBe(2);
  });
});
