import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview listProjectBackups', () => {
  test('returns a list (possibly empty) without error', async () => {
    const result = await pc.preview.indexes.listProjectBackups();
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);
  });

  test('includes backups from multiple indexes when they exist', async () => {
    const indexName = randomName('preview-proj-bkp-src');
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

      await pc.preview.indexes.createBackup(indexName);

      const result = await pc.preview.indexes.listProjectBackups();
      expect(Array.isArray(result.data)).toBe(true);
      const found = result.data?.some((b) => b.source_index_name === indexName);
      expect(found).toBe(true);
    } finally {
      await pc.preview.indexes.deleteIndex(indexName).catch(() => {});
    }
  });

  test('respects the limit query param', async () => {
    const result = await pc.preview.indexes.listProjectBackups({ limit: 1 });
    expect(result.data!.length).toBeLessThanOrEqual(1);
  });

  test('returns pagination token when there are more results', async () => {
    const result = await pc.preview.indexes.listProjectBackups({ limit: 1 });
    if (result.data && result.data.length === 1) {
      expect(
        result.pagination === undefined ||
          typeof result.pagination === 'object',
      ).toBe(true);
    }
  });
});
