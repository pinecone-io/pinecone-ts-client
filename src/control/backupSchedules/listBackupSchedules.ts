import type {
  ManageIndexesApi,
  BackupScheduleList as GeneratedBackupScheduleList,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { BackupScheduleModel } from './describeBackupSchedule';

/**
 * A page of backup schedules. When `pagination` is present, pass its `next`
 * value as `paginationToken` to fetch the following page.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface BackupScheduleList extends Omit<
  GeneratedBackupScheduleList,
  'data'
> {
  /** The schedules on this page. */
  data: Array<BackupScheduleModel>;
}

/**
 * Pagination options shared by the backup schedule listings.
 */
export interface ListBackupSchedulesOptions {
  /** Maximum number of results to return per page. */
  limit?: number;
  /** Pagination token from a prior response to retrieve the next page. */
  paginationToken?: string;
}

/**
 * Lists the backup schedules attached to an index.
 *
 * @param api - The manage-indexes API client.
 * @param indexName - Name of the index whose schedules to list.
 * @param options - Optional pagination parameters.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function listBackupSchedules(
  api: ManageIndexesApi,
  indexName: string,
  options: ListBackupSchedulesOptions = {},
): Promise<BackupScheduleList> {
  if (!indexName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `indexName` in order to list backup schedules.',
    );
  }
  try {
    return await api.listBackupSchedules({
      indexName,
      limit: options.limit,
      paginationToken: options.paginationToken,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing backup schedules for index ${indexName}: ${rawMessageText}`,
    );
  }
}
