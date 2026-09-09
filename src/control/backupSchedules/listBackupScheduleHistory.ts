import type {
  ManageIndexesApi,
  BackupScheduleHistoryItem as GeneratedBackupScheduleHistoryItem,
  BackupScheduleHistoryList as GeneratedBackupScheduleHistoryList,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { ScheduledBackupStatus } from '../types';
import type { IndexSchema } from '../indexes/listIndexes';
import type { ListBackupSchedulesOptions } from './listBackupSchedules';

/**
 * A backup produced by a schedule. A row appears as soon as a run is planned,
 * so `status` is `Scheduled` and `scheduledExecutionAt` is set until the run
 * starts.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface BackupScheduleHistoryItem extends Omit<
  GeneratedBackupScheduleHistoryItem,
  'status' | 'schema'
> {
  /** The current status of the backup. */
  status: ScheduledBackupStatus;
  /** The schema of the index the backup was taken from. */
  schema?: IndexSchema | null;
}

/**
 * A page of backups produced by a schedule. When `pagination` is present, pass
 * its `next` value as `paginationToken` to fetch the following page.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface BackupScheduleHistoryList extends Omit<
  GeneratedBackupScheduleHistoryList,
  'data'
> {
  /** The backups on this page. */
  data: Array<BackupScheduleHistoryItem>;
}

/**
 * Lists the backups a schedule has produced or planned.
 *
 * @param api - The manage-indexes API client.
 * @param scheduleId - The ID of the schedule whose history to list.
 * @param options - Optional pagination parameters.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function listBackupScheduleHistory(
  api: ManageIndexesApi,
  scheduleId: string,
  options: ListBackupSchedulesOptions = {},
): Promise<BackupScheduleHistoryList> {
  if (!scheduleId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `scheduleId` in order to list backup schedule history.',
    );
  }
  try {
    return await api.listBackupScheduleHistory({
      scheduleId,
      limit: options.limit,
      paginationToken: options.paginationToken,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing history for backup schedule ${scheduleId}: ${rawMessageText}`,
    );
  }
}
