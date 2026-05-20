import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createBackup', () => {
  test('creates a backup for an existing alpha index', async () => {
    const indexName = randomName('preview-backup-src');
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

      const backup = await pc.preview.indexes.createBackup(indexName, {
        name: 'test-backup',
        description: 'Integration test backup',
      });

      expect(backup.backup_id).toBeDefined();
      expect(backup.source_index_name).toEqual(indexName);
      expect(['Initializing', 'Ready']).toContain(backup.status);
    } finally {
      await pc.deleteIndex(indexName).catch(() => {});
    }
  });
});
