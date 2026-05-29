import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview describeIndex', () => {
  test('returns IndexModel with schema field for a schema-based index', async () => {
    const indexName = randomName('preview-desc');

    try {
      await pc.preview.indexes.create({
        name: indexName,
        schema: {
          fields: {
            chunk_text: { type: 'string', full_text_search: {} },
          },
        },
        waitUntilReady: true,
      });

      const result = await pc.preview.indexes.describe(indexName);
      expect(result.name).toEqual(indexName);
      expect(result.schema).toBeDefined();
      expect(result.schema.fields).toBeDefined();
    } finally {
      await pc.preview.indexes.delete(indexName).catch(() => {});
    }
  });

  test('throws for an index that does not exist', async () => {
    await expect(
      pc.preview.indexes.describe('definitely-does-not-exist-xyzzy'),
    ).rejects.toBeDefined();
  });
});
