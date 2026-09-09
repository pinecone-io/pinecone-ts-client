import { Pinecone } from '../../index';
import { PineconeNotFoundError } from '../../errors';
import type {
  BackupModel,
  RestoreJobModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import {
  assertWithRetries,
  cleanupResources,
  randomName,
  retryDelete,
  waitUntilIndexReady,
} from '../test-helpers';

// Follow pagination: matrix jobs and older test runs can fill the first page.
async function findInPages<T>(
  list: (token?: string) => Promise<{
    data?: T[];
    pagination?: { next?: string } | null;
  }>,
  matches: (item: T) => boolean,
): Promise<T | undefined> {
  let token: string | undefined;
  const seen = new Set<string>();
  do {
    const page = await list(token);
    const found = page.data?.find(matches);
    if (found) return found;
    token = page.pagination?.next;
    if (token) {
      if (seen.has(token))
        throw new Error('List returned a repeated pagination token');
      seen.add(token);
    }
  } while (token);
  return undefined;
}

describe('backup and restore lifecycle', () => {
  const pc = new Pinecone();

  test('restores seeded records and explicit read capacity through a restore job', async () => {
    // Every matrix leg owns both indexes; shared fixtures must never be deleted.
    const sourceName = randomName('backup-source');
    const restoredName = randomName('backup-restored');
    const namespace = 'backup-records';
    const records = [
      { id: 'first', values: [1, 0], metadata: { label: 'first' } },
      { id: 'second', values: [0, 1], metadata: { label: 'second' } },
    ];
    let backupId: string | undefined;
    const failures: unknown[] = [];
    try {
      await pc.indexes.create({
        name: sourceName,
        deployment: {
          deploymentType: 'managed',
          cloud: 'aws',
          region: 'us-west-2',
        },
        // Reserved fields create an index served by the legacy vectors API.
        schema: {
          fields: {
            _values: {
              type: 'dense_vector',
              dimension: 2,
              metric: 'dotproduct',
            },
          },
        },
        waitUntilReady: true,
        tags: { project: 'pinecone-integration-tests' },
      });
      const source = pc.index({ name: sourceName, namespace });
      await source.upsert({ records });
      await assertWithRetries(
        () => source.describeIndexStats(),
        (stats) => {
          expect(stats.namespaces?.[namespace]?.recordCount).toBe(
            records.length,
          );
        },
      );
      await assertWithRetries(
        () => source.fetch({ ids: records.map(({ id }) => id) }),
        (result) => {
          for (const record of records)
            expect(result.records[record.id]).toMatchObject(record);
        },
      );
      const backup = await pc.backups.create(sourceName, {
        name: randomName('integration-backup'),
        description: 'SDK backup restore integration test',
      });
      backupId = backup.backupId;
      expect(backupId).toEqual(expect.any(String));
      expect(backupId.length).toBeGreaterThan(0);
      expect(backup.sourceIndexName).toBe(sourceName);
      const id = backupId;
      // The public backup status is Ready (the internal storage status is Completed).
      await assertWithRetries(
        () => pc.backups.describe(id),
        (result: BackupModel) => {
          expect(result.status).toBe('Ready');
        },
      );
      await assertWithRetries(
        () =>
          findInPages(
            (paginationToken) =>
              pc.backups.listByIndex(sourceName, {
                limit: 100,
                paginationToken,
              }),
            (item) => item.backupId === id,
          ),
        (result) =>
          expect(result).toMatchObject({
            backupId: id,
            sourceIndexName: sourceName,
          }),
      );
      await assertWithRetries(
        () =>
          findInPages(
            (paginationToken) =>
              pc.backups.list({ limit: 100, paginationToken }),
            (item) => item.backupId === id,
          ),
        (result) => expect(result).toMatchObject({ backupId: id }),
      );

      const restore = await pc.backups.createIndex(id, {
        name: restoredName,
        readCapacity: { mode: 'OnDemand' },
        deletionProtection: 'disabled',
      });
      expect(restore.restoreJobId).toEqual(expect.any(String));
      expect(restore.restoreJobId.length).toBeGreaterThan(0);
      expect(restore.indexId).toEqual(expect.any(String));
      expect(restore.indexId.length).toBeGreaterThan(0);
      await assertWithRetries(
        () => pc.restoreJobs.describe(restore.restoreJobId),
        (job: RestoreJobModel) => {
          expect(job).toMatchObject({
            restoreJobId: restore.restoreJobId,
            backupId: id,
            targetIndexName: restoredName,
            targetIndexId: restore.indexId,
            status: 'Completed',
            percentComplete: 100,
          });
        },
        600_000,
        5000,
      );
      await assertWithRetries(
        () =>
          findInPages(
            (paginationToken) =>
              pc.restoreJobs.list({ limit: 100, paginationToken }),
            (job) => job.restoreJobId === restore.restoreJobId,
          ),
        (job) =>
          expect(job).toMatchObject({ backupId: id, status: 'Completed' }),
      );
      await waitUntilIndexReady(restoredName);
      const restoredDescription = await pc.indexes.describe(restoredName);
      expect(restoredDescription.readCapacity).toMatchObject({
        mode: 'OnDemand',
      });
      const restored = pc.index({ name: restoredName, namespace });
      await assertWithRetries(
        () => restored.describeIndexStats(),
        (stats) => {
          expect(stats.totalRecordCount).toBe(records.length);
          expect(stats.namespaces?.[namespace]?.recordCount).toBe(
            records.length,
          );
        },
      );
      await assertWithRetries(
        () => restored.fetch({ ids: records.map(({ id }) => id) }),
        (result) => {
          for (const record of records)
            expect(result.records[record.id]).toMatchObject(record);
        },
      );
      await pc.backups.delete(id);
      await assertWithRetries(
        async () => {
          await expect(pc.backups.describe(id)).rejects.toBeInstanceOf(
            PineconeNotFoundError,
          );
        },
        () => {},
      );
      backupId = undefined;
    } catch (error) {
      failures.push(error);
    } finally {
      // Attempt all cleanup, including when creation or a later assertion fails.
      const results = await Promise.allSettled([
        cleanupResources(pc, [sourceName, restoredName]),
        ...(backupId
          ? [
              retryDelete(
                () => pc.backups.delete(backupId!),
                `backup '${backupId}'`,
              ),
            ]
          : []),
      ]);
      failures.push(
        ...results.flatMap((result) =>
          result.status === 'rejected' ? [result.reason] : [],
        ),
      );
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length)
      throw new AggregateError(
        failures,
        `Backup integration failed: ${failures.map(String).join('; ')}`,
      );
  }, 1_800_000);

  test('unknown backup IDs return not-found for describe and delete', async () => {
    const missingId = crypto.randomUUID();
    await expect(pc.backups.describe(missingId)).rejects.toBeInstanceOf(
      PineconeNotFoundError,
    );
    await expect(pc.backups.delete(missingId)).rejects.toBeInstanceOf(
      PineconeNotFoundError,
    );
  });
});
