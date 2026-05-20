import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview describeBackup', () => {
  test('returns BackupModel for an existing backup', async () => {
    const indexName = randomName('preview-desc-bk-src');
    let backupId: string | undefined;

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

      const backup = await pc.preview.indexes.createBackup(indexName);
      backupId = backup.backup_id;

      const described = await pc.preview.indexes.describeBackup(backupId);
      expect(described.backup_id).toEqual(backupId);
      expect(described.source_index_name).toEqual(indexName);
      expect(['Initializing', 'Ready']).toContain(described.status);
    } finally {
      await pc.preview.indexes.deleteIndex(indexName).catch(() => {});
    }
  });
});
