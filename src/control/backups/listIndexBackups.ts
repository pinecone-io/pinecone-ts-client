import type {
  ManageIndexesApi,
  BackupList as GeneratedBackupList,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import type { BackupModel } from './describeBackup';

export type {
  // The pagination cursor on a `BackupList`.
  BackupListPagination,
} from '../../pinecone-generated-ts-fetch/db_control';

/**
 * A page of backups. When `pagination` is present, pass its `next` value as
 * `paginationToken` to fetch the following page.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface BackupList extends Omit<GeneratedBackupList, 'data'> {
  data?: Array<BackupModel>;
}

/**
 * Options for listing backups of an index.
 */
export interface ListIndexBackupsOptions {
  /** Maximum number of results to return per page (1–100, default: 10). */
  limit?: number;
  /** Pagination token from a prior response to retrieve the next page. */
  paginationToken?: string;
  /**
   * When `true`, returns backups from every index in the project that has ever
   * used this name, including deleted ones. Backups from a deleted index carry a
   * `sourceIndexDeletedAt` timestamp.
   *
   * When `false` or omitted, `indexName` must resolve to an active index; if only
   * deleted indexes have used the name, the API returns a 404 rather than an
   * empty list.
   */
  includeDeleted?: boolean;
}

/**
 * Lists all backups for an index.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function listIndexBackups(
  api: ManageIndexesApi,
  indexName: string,
  options: ListIndexBackupsOptions = {},
): Promise<BackupList> {
  if (!indexName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `indexName` in order to list backups.',
    );
  }
  try {
    return await api.listIndexBackups({
      indexName,
      limit: options.limit,
      paginationToken: options.paginationToken,
      includeDeleted: options.includeDeleted,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing backups for index ${indexName}: ${rawMessageText}`,
    );
  }
}
