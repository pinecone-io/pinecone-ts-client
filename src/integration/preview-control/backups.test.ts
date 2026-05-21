import { Pinecone, PreviewIndexModel, PreviewBackupModel } from '../../index';
import { randomName } from '../test-helpers';

describe('preview backups', () => {
  let pc: Pinecone;
  let index: PreviewIndexModel;
  let backup: PreviewBackupModel;

  beforeAll(async () => {
    pc = new Pinecone();

    // You cannot create backups with FTS / schema indexes yet, so we use a standard
    // serverless index to test backups integration
    const indexName = randomName('preview-backup-src');
    index = await pc.preview.indexes.createIndex({
      name: indexName,
      schema: {
        fields: {
          embedding: {
            type: 'dense_vector',
            dimension: 3,
            metric: 'cosine',
          },
        },
      },
      waitUntilReady: true,
    });
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
        (backup) => backup.backup_id === backup.backup_id,
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
