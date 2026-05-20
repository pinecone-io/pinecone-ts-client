import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createIndexFromBackup', () => {
  test('creates an index from a backup and returns a restore job ID', async () => {
    const srcName = randomName('preview-cifb-src');
    const restoredName = randomName('preview-cifb-dst');
    let backupId: string | undefined;

    try {
      await pc.preview.indexes.createIndex({
        name: srcName,
        schema: {
          fields: {
            chunk_text: { type: 'string', full_text_search: {} },
          },
        },
        waitUntilReady: true,
      });

      const backup = await pc.preview.indexes.createBackup(srcName);
      backupId = backup.backup_id;

      const resp = await pc.preview.indexes.createIndexFromBackup(backupId, {
        name: restoredName,
      });
      expect(resp.restore_job_id).toBeDefined();
      expect(resp.index_id).toBeDefined();
    } finally {
      await pc.preview.indexes.deleteIndex(srcName).catch(() => {});
      await pc.preview.indexes.deleteIndex(restoredName).catch(() => {});
      if (backupId) {
        await pc.preview.indexes.deleteBackup(backupId).catch(() => {});
      }
    }
  });
});
