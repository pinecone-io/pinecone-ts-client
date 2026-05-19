import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createIndex', () => {
  test('creates a schema-based serverless index and cleans up', async () => {
    const indexName = randomName('preview-schema');

    try {
      const result = await pc.preview.indexes.createIndex({
        name: indexName,
        schema: {
          fields: {
            chunk_text: { type: 'string', full_text_search: {} },
          },
        },
        waitUntilReady: true,
      });

      expect(result.name).toEqual(indexName);
      expect(result.schema).toBeDefined();
      expect(result.schema.fields).toBeDefined();
    } finally {
      await pc.deleteIndex(indexName).catch(() => {});
    }
  });

  test('rejects duplicate index name', async () => {
    const indexName = randomName('preview-dupe');

    try {
      await pc.preview.indexes.createIndex({
        name: indexName,
        schema: {
          fields: {
            chunk_text: { type: 'string', full_text_search: {} },
          },
        },
        waitUntilReady: true,
      });

      await expect(
        pc.preview.indexes.createIndex({
          name: indexName,
          schema: {
            fields: {
              chunk_text: { type: 'string', full_text_search: {} },
            },
          },
        }),
      ).rejects.toBeDefined();
    } finally {
      await pc.deleteIndex(indexName).catch(() => {});
    }
  });
});
