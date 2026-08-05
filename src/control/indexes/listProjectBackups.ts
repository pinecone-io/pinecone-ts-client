import type {
  ManageIndexesApi,
  BackupList,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { handleApiError } from '../../errors/handling';

/**
 * Options for listing all backups in a project.
 *
 */
export interface ListProjectBackupsOptions {
  /** Maximum number of results to return per page (1–100, default: 10). */
  limit?: number;
  /** Pagination token from a prior response to retrieve the next page. */
  paginationToken?: string;
}

/**
 * Lists all backups across every index in the project.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function listProjectBackups(
  api: ManageIndexesApi,
  options: ListProjectBackupsOptions = {},
): Promise<BackupList> {
  try {
    return await api.listProjectBackups({
      limit: options.limit,
      paginationToken: options.paginationToken,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing project backups: ${rawMessageText}`,
    );
  }
}
