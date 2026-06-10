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
      const result = await pc.preview.indexes.create({
        name: indexName,
        schema: {
          fields: {
            chunk_text: { type: 'string', fullTextSearch: {} },
          },
        },
        waitUntilReady: true,
      });

      expect(result.name).toEqual(indexName);
      expect(result.schema).toBeDefined();
      expect(result.schema.fields).toBeDefined();
    } finally {
      await pc.preview.indexes.delete(indexName).catch(() => {});
    }
  });

  test('rejects duplicate index name', async () => {
    const indexName = randomName('preview-dupe');

    try {
      await pc.preview.indexes.create({
        name: indexName,
        schema: {
          fields: {
            chunk_text: { type: 'string', fullTextSearch: {} },
          },
        },
        waitUntilReady: true,
      });

      await expect(
        pc.preview.indexes.create({
          name: indexName,
          schema: {
            fields: {
              chunk_text: { type: 'string', fullTextSearch: {} },
            },
          },
        }),
      ).rejects.toBeDefined();
    } finally {
      await pc.preview.indexes.delete(indexName).catch(() => {});
    }
  });
});
