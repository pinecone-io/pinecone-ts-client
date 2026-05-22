import { Pinecone, IndexModel, PreviewBackupModel } from '../../index';
import { randomName } from '../test-helpers';

describe('preview backups', () => {
  let pc: Pinecone;
  let index: IndexModel;
  let backup: PreviewBackupModel;

  beforeAll(async () => {
    pc = new Pinecone();

    // Create a generic serverless index through non-preview API to test preview backups integration
    const indexName = randomName('preview-backup-src');
    index = (await pc.createIndex({
      name: indexName,
      dimension: 3,
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
      waitUntilReady: true,
    })) as IndexModel; // we're not suppressing conflicts so we know the response should be an IndexModel
    expect(index.name).toEqual(indexName);

    // Create shared backup
    backup = await pc.preview.indexes.createBackup(indexName, {
      name: 'test-backup',
      description: 'Integration test backup',
    });
    expect(backup.backup_id).toBeDefined();
    expect(backup.source_index_name).toEqual(indexName);
  });

  afterAll(async () => {
    await pc.preview.indexes.deleteIndex(index.name).catch(() => {});
    await pc.preview.indexes.deleteBackup(backup.backup_id).catch(() => {});
  });

  describe('preview describeBackup', () => {
    test('returns PreviewBackupModel for an existing backup', async () => {
      const backupId = backup.backup_id;

      const described = await pc.preview.indexes.describeBackup(backupId);
      expect(described.backup_id).toEqual(backupId);
      expect(described.source_index_name).toEqual(index.name);
      expect(['Initializing', 'Ready']).toContain(described.status);
    });
  });

  describe('preview listIndexBackups', () => {
    test('lists backups for an existing alpha index', async () => {
      const result = await pc.preview.indexes.listIndexBackups(index.name);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(1);
      expect(result.data![0].source_index_name).toEqual(index.name);
    });

    test('respects the limit query param', async () => {
      const result = await pc.preview.indexes.listIndexBackups(index.name, {
        limit: 1,
      });
      expect(result.data!.length).toBeLessThanOrEqual(1);
    });
  });

  describe('preview listProjectBackups', () => {
    test('returns a list including existing backup', async () => {
      const result = await pc.preview.indexes.listProjectBackups();
      expect(result.data!.length).toBeGreaterThanOrEqual(1);
      const someBackup = result.data!.some(
        (currBackup) => currBackup.backup_id === backup.backup_id,
      );
      expect(someBackup).toBe(true);
    });
  });

  describe('preview listRestoreJobs', () => {
    test('returns a data array without error', async () => {
      const result = await pc.preview.indexes.listRestoreJobs();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
