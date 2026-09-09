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
 * Backup schedules create index backups at a recurring cadence and retain them for a set number of days.
 * Access them through {@link Pinecone.backupSchedules}; do not construct this class directly.
 * Use {@link Backups.create} for a single backup.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * const schedules = await pc.backupSchedules.list('product-catalog');
 * ```
 */
export class BackupSchedules {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Creates an enabled backup schedule for an index.
   *
   * @param indexName - The serverless or BYOC index to back up, such as `product-catalog`.
   * @param options - The schedule name, frequency, and number of days to retain each backup.
   * @returns The schedule configuration, ID, and `nextScheduledRun`.
   * @throws {@link Errors.PineconeArgumentError} when the index name or schedule name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const schedule = await pc.backupSchedules.create('product-catalog', {
   *   name: 'catalog-daily',
   *   frequency: 'daily',
   *   retentionDays: 30,
   * });
   * console.log(schedule.scheduleId, schedule.nextScheduledRun);
   * ```
   *
   * @see {@link Backups.create} for a single backup.
   */
  async create(
    indexName: string,
    options: CreateBackupScheduleOptions,
  ): Promise<BackupScheduleModel> {
    return createBackupSchedule(this._api, indexName, options);
  }

  /**
   * Lists one page of enabled and disabled backup schedules for an index.
   *
   * @param indexName - The index whose schedules to list.
   * @param options - Page size and continuation token. Omit to fetch the first page with the default size.
   * @returns Schedules in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const page = await pc.backupSchedules.list('product-catalog', { limit: 10 });
   * console.log(page.data, page.pagination?.next);
   * ```
   */
  async list(
    indexName: string,
    options?: ListBackupSchedulesOptions,
  ): Promise<BackupScheduleList> {
    return listBackupSchedules(this._api, indexName, options);
  }

  /**
   * Retrieves a backup schedule configuration and its next run time.
   *
   * @param scheduleId - The schedule ID returned by {@link BackupSchedules.create} or {@link BackupSchedules.list}.
   * @returns The schedule configuration; `nextScheduledRun` is `null` while disabled.
   * @throws {@link Errors.PineconeArgumentError} when the schedule ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const schedule = await pc.backupSchedules.describe('e88f7273-42aa-47e9-af73-593827136867');
   * console.log(schedule.enabled, schedule.nextScheduledRun);
   * ```
   */
  async describe(scheduleId: string): Promise<BackupScheduleModel> {
    return describeBackupSchedule(this._api, scheduleId);
  }

  /**
   * Updates a backup schedule. Omitted fields remain unchanged.
   *
   * The schedule name and index cannot be changed.
   *
   * @param scheduleId - The ID of the schedule to update.
   * @param options - The frequency, retention, or enabled state to change. See {@link UpdateBackupScheduleOptions} for effects on existing backups and run times.
   * @returns The updated schedule configuration and next run time.
   * @throws {@link Errors.PineconeArgumentError} when the schedule ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const schedule = await pc.backupSchedules.update(
   *   'e88f7273-42aa-47e9-af73-593827136867',
   *   { enabled: false },
   * );
   * console.log(schedule.enabled);
   * ```
   */
  async update(
    scheduleId: string,
    options: UpdateBackupScheduleOptions,
  ): Promise<BackupScheduleModel> {
    return updateBackupSchedule(this._api, scheduleId, options);
  }

  /**
   * Deletes a backup schedule, stopping future runs.
   *
   * Existing backups remain until their retention window ends.
   *
   * @param scheduleId - The ID of the schedule to delete.
   * @returns Resolves when the schedule has been deleted.
   * @throws {@link Errors.PineconeArgumentError} when the schedule ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.backupSchedules.delete('e88f7273-42aa-47e9-af73-593827136867');
   * ```
   */
  async delete(scheduleId: string): Promise<void> {
    return deleteBackupSchedule(this._api, scheduleId);
  }

  /**
   * Lists one page of backups produced or planned by a schedule.
   *
   * Check each backup status: the page can include runs that have not started.
   *
   * @param scheduleId - The ID of the schedule whose history to list.
   * @param options - Page size and continuation token. Omit to fetch the first page with the default size.
   * @returns Backups in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   * @throws {@link Errors.PineconeArgumentError} when the schedule ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const page = await pc.backupSchedules.history('e88f7273-42aa-47e9-af73-593827136867');
   * for (const backup of page.data) {
   *   console.log(backup.backupId, backup.status);
   * }
   * ```
   *
   * @see {@link Backups.listByIndex} for all backups of an index, including unscheduled backups.
   */
  async history(
    scheduleId: string,
    options?: ListBackupSchedulesOptions,
  ): Promise<BackupScheduleHistoryList> {
    return listBackupScheduleHistory(this._api, scheduleId, options);
  }
}
