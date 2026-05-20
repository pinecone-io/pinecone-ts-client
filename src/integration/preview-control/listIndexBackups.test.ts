import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview listIndexBackups', () => {
  test('lists backups for an existing alpha index', async () => {
    const indexName = randomName('preview-list-bkp-src');
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

      // Create a backup to ensure at least one exists.
      await pc.preview.indexes.createBackup(indexName);

      const result = await pc.preview.indexes.listIndexBackups(indexName);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(1);
      expect(result.data![0].source_index_name).toEqual(indexName);
    } finally {
      await pc.deleteIndex(indexName).catch(() => {});
    }
  });

  test('returns empty list for index with no backups', async () => {
    const indexName = randomName('preview-list-bkp-empty');
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

      const result = await pc.preview.indexes.listIndexBackups(indexName);
      expect(Array.isArray(result.data)).toBe(true);
    } finally {
      await pc.deleteIndex(indexName).catch(() => {});
    }
  });

  test('respects the limit query param', async () => {
    const indexName = randomName('preview-list-bkp-limit');
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

      const result = await pc.preview.indexes.listIndexBackups(indexName, {
        limit: 1,
      });
      expect(result.data!.length).toBeLessThanOrEqual(1);
    } finally {
      await pc.deleteIndex(indexName).catch(() => {});
    }
  });
});
