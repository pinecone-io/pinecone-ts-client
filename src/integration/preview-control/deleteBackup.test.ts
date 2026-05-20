import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview deleteBackup', () => {
  test('deletes an existing backup without error', async () => {
    const indexName = randomName('preview-del-bk-src');
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

      await pc.preview.indexes.deleteBackup(backupId);
      // Deletion is async (202 Accepted); verify 404 on subsequent describe
      await expect(
        pc.preview.indexes.describeBackup(backupId),
      ).rejects.toBeDefined();
    } finally {
      await pc.preview.indexes.deleteIndex(indexName).catch(() => {});
    }
  });
});
