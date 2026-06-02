import { Pinecone, IndexModel, PreviewBackupModel } from '../../index';
import { PineconeNotFoundError } from '../../errors';
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
    expect(backup.backupId).toBeDefined();
    expect(backup.sourceIndexName).toEqual(indexName);
  });

  afterAll(async () => {
    await pc.preview.indexes.delete(index.name).catch(() => {});
    await pc.preview.indexes.deleteBackup(backup.backupId).catch(() => {});
  });

  describe('preview describeBackup', () => {
    test('returns PreviewBackupModel for an existing backup', async () => {
      const backupId = backup.backupId;

      const described = await pc.preview.indexes.describeBackup(backupId);
      expect(described.backupId).toEqual(backupId);
      expect(described.sourceIndexName).toEqual(index.name);
      expect(['Initializing', 'Ready']).toContain(described.status);
    });
  });

  describe('preview listIndexBackups', () => {
    test('lists backups for an existing alpha index', async () => {
      const result = await pc.preview.indexes.listBackups(index.name);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(1);
      expect(result.data![0].sourceIndexName).toEqual(index.name);
    });

    test('respects the limit query param', async () => {
      const result = await pc.preview.indexes.listBackups(index.name, {
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
        (currBackup) => currBackup.backupId === backup.backupId,
      );
      expect(someBackup).toBe(true);
    });
  });

  describe('preview listRestoreJobs/describeRestoreJob', () => {
    test('returns RestoreJobModel for an existing restore job if one exists', async () => {
      const result = await pc.preview.indexes.listRestoreJobs({ limit: 1 });
      if (result.data.length > 0) {
        const described = await pc.preview.indexes.describeRestoreJob(
          result.data[0].restoreJobId,
        );
        expect(described.restoreJobId).toBeDefined();
        expect(described.backupId).toBeDefined();
        expect(described.status).toBeDefined();
        expect(described.targetIndexName).toBeDefined();
      } else {
        console.log('No restore jobs found, skipping describe assertion');
      }
    });

    test('throws PineconeNotFoundError for a non-existent jobId', async () => {
      await expect(
        pc.preview.indexes.describeRestoreJob('nonexistent-job-id-xyz'),
      ).rejects.toThrow(PineconeNotFoundError);
    });
  });
});
