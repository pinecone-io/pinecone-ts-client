import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import {
  createBackupSchedule,
  CreateBackupScheduleOptions,
} from './createBackupSchedule';
import {
  listBackupSchedules,
  BackupScheduleList,
  ListBackupSchedulesOptions,
} from './listBackupSchedules';
import {
  describeBackupSchedule,
  BackupScheduleModel,
} from './describeBackupSchedule';
import {
  updateBackupSchedule,
  UpdateBackupScheduleOptions,
} from './updateBackupSchedule';
import { deleteBackupSchedule } from './deleteBackupSchedule';
import {
  listBackupScheduleHistory,
  BackupScheduleHistoryList,
} from './listBackupScheduleHistory';

/**
 * Control-plane operations for backup schedules, which back up an index on a
 * fixed cadence and keep each backup for a set number of days. Access via
 * `pc.backupSchedules`.
 *
 * Use this instead of calling {@link Backups.create} on a timer of your own.
 * The backups a schedule produces are ordinary backups: read one with
 * {@link Backups.describe}, or list a schedule's own runs with
 * {@link BackupSchedules.history}. At most one schedule per index can be
 * enabled at a time.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const schedules = await pc.backupSchedules.list('product-search');
 * ```
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export class BackupSchedules {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Creates a backup schedule for an index. The schedule starts enabled, so the
   * returned `nextScheduledRun` is already set.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const schedule = await pc.backupSchedules.create('product-search', {
   *   name: 'compliance-snapshots',
   *   frequency: 'daily',
   *   retentionDays: 90,
   * });
   * console.log(schedule);
   * // {
   * //   scheduleId: 'e88f7273-42aa-47e9-af73-593827136867',
   * //   name: 'compliance-snapshots',
   * //   indexId: 'b480770b-600d-4c4e-bf19-799c933ae2bf',
   * //   projectId: '7f1c2a9e-3b4d-4c5e-8f6a-1b2c3d4e5f60',
   * //   scheduleType: 'time-based',
   * //   frequency: 'daily',
   * //   retentionExpireAfterDays: 90,
   * //   enabled: true,
   * //   nextScheduledRun: 2026-04-03T06:00:00.000Z,
   * //   createdAt: 2026-04-02T14:12:09.000Z
   * // }
   * ```
   *
   * @param indexName - Name of the serverless or BYOC index to back up.
   * @param options - The {@link CreateBackupScheduleOptions}: `name`, `frequency`, and `retentionDays` are all required.
   * @throws {@link Errors.PineconeArgumentError} when `indexName` or `name` is empty.
   * @throws {@link Errors.PineconeConflictError} when the index already has an enabled schedule. Disable or delete it first.
   * @throws {@link Errors.PineconeBadRequestError} when the project's plan does not include scheduled backups, or when the index is pod-based.
   * @returns A promise that resolves to the new {@link BackupScheduleModel}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async create(
    indexName: string,
    options: CreateBackupScheduleOptions,
  ): Promise<BackupScheduleModel> {
    return createBackupSchedule(this._api, indexName, options);
  }

  /**
   * Lists the backup schedules attached to an index, one page at a time.
   * Disabled schedules are included, so a listing can hold several rows even
   * though at most one is enabled.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const schedules = await pc.backupSchedules.list('product-search', { limit: 10 });
   * console.log(schedules);
   * // {
   * //   data: [
   * //     {
   * //       scheduleId: 'e88f7273-42aa-47e9-af73-593827136867',
   * //       name: 'compliance-snapshots',
   * //       frequency: 'daily',
   * //       enabled: true,
   * //       ...
   * //     }
   * //   ],
   * //   pagination: null
   * // }
   * ```
   *
   * @param indexName - Name of the index whose schedules to list.
   * @param options - Optional {@link ListBackupSchedulesOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeArgumentError} when `indexName` is empty.
   * @returns A promise that resolves to a {@link BackupScheduleList}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async list(
    indexName: string,
    options?: ListBackupSchedulesOptions,
  ): Promise<BackupScheduleList> {
    return listBackupSchedules(this._api, indexName, options);
  }

  /**
   * Retrieves the configuration and status of a backup schedule.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const schedule = await pc.backupSchedules.describe('e88f7273-42aa-47e9-af73-593827136867');
   * console.log(schedule.enabled, schedule.nextScheduledRun);
   * // true 2026-04-03T06:00:00.000Z
   * ```
   *
   * @param scheduleId - The `scheduleId` returned by {@link BackupSchedules.create} or {@link BackupSchedules.list}, not the index name.
   * @throws {@link Errors.PineconeArgumentError} when `scheduleId` is empty.
   * @throws {@link Errors.PineconeNotFoundError} when no schedule has that ID.
   * @returns A promise that resolves to a {@link BackupScheduleModel}. `nextScheduledRun` is `null` exactly when the schedule is disabled.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async describe(scheduleId: string): Promise<BackupScheduleModel> {
    return describeBackupSchedule(this._api, scheduleId);
  }

  /**
   * Updates the cadence, retention, or enabled state of a backup schedule.
   * Only the fields you pass are sent; the rest are left unchanged. The
   * schedule's name and index cannot be changed.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const updated = await pc.backupSchedules.update(
   *   'e88f7273-42aa-47e9-af73-593827136867',
   *   { frequency: 'weekly', retentionDays: 30 },
   * );
   * console.log(updated.frequency, updated.retentionExpireAfterDays);
   * // weekly 30
   *
   * // Pause the schedule, keeping the rest of its configuration
   * const paused = await pc.backupSchedules.update(
   *   'e88f7273-42aa-47e9-af73-593827136867',
   *   { enabled: false },
   * );
   * console.log(paused.nextScheduledRun);
   * // null
   * ```
   *
   * @param scheduleId - The ID of the schedule to update.
   * @param options - The {@link UpdateBackupScheduleOptions} to change. Passing `enabled: true` to a paused schedule runs a backup right away and recomputes `nextScheduledRun` from now, so a pause and resume shifts the cadence rather than resuming the old slot.
   * @throws {@link Errors.PineconeArgumentError} when `scheduleId` is empty.
   * @throws {@link Errors.PineconeNotFoundError} when no schedule has that ID.
   * @throws {@link Errors.PineconeConflictError} when `enabled: true` would make a second enabled schedule on the same index.
   * @returns A promise that resolves to the updated {@link BackupScheduleModel}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async update(
    scheduleId: string,
    options: UpdateBackupScheduleOptions,
  ): Promise<BackupScheduleModel> {
    return updateBackupSchedule(this._api, scheduleId, options);
  }

  /**
   * Deletes a backup schedule, stopping future runs. Backups it already
   * produced are kept until their own retention window ends.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.backupSchedules.delete('e88f7273-42aa-47e9-af73-593827136867');
   * ```
   *
   * @param scheduleId - The ID of the schedule to delete.
   * @throws {@link Errors.PineconeArgumentError} when `scheduleId` is empty.
   * @throws {@link Errors.PineconeNotFoundError} when no schedule has that ID, including on a retry after a delete that already succeeded.
   * @returns A promise that resolves when the schedule has been deleted.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async delete(scheduleId: string): Promise<void> {
    return deleteBackupSchedule(this._api, scheduleId);
  }

  /**
   * Lists the backups a schedule has produced, one page at a time. A row
   * appears as soon as a run is planned, so the listing mixes completed
   * backups with ones that have not started yet. A schedule created moments
   * ago has little or nothing in it.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const runs = await pc.backupSchedules.history('e88f7273-42aa-47e9-af73-593827136867');
   * for (const run of runs.data) {
   *   console.log(run.backupId, run.status, run.scheduledExecutionAt);
   * }
   * // b2c3d4e5-f6a7-8901-bcde-f12345678901 Scheduled 2026-04-03T06:00:00.000Z
   * // a1b2c3d4-e5f6-7890-abcd-ef1234567890 Ready undefined
   * ```
   *
   * @param scheduleId - The ID of the schedule whose history to list.
   * @param options - Optional {@link ListBackupSchedulesOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeArgumentError} when `scheduleId` is empty.
   * @throws {@link Errors.PineconeNotFoundError} when no schedule has that ID.
   * @returns A promise that resolves to a {@link BackupScheduleHistoryList}.
   * @see {@link Backups.listByIndex} for every backup of an index, scheduled or not.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async history(
    scheduleId: string,
    options?: ListBackupSchedulesOptions,
  ): Promise<BackupScheduleHistoryList> {
    return listBackupScheduleHistory(this._api, scheduleId, options);
  }
}
