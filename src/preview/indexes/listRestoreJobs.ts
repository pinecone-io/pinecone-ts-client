import type {
  ManageIndexesApi,
  RestoreJobList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { handleApiError } from '../../errors/handling';

export type { RestoreJobList as PreviewRestoreJobList } from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Options for listing restore jobs.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export interface PreviewListRestoreJobsOptions {
  /** Maximum number of jobs to return (1–100, default 10). */
  limit?: number;
  /** Pagination token from a previous response. */
  paginationToken?: string;
}

/**
 * Lists all restore jobs for the current project using the 2026-01.alpha API.
 *
 * @param api - The alpha manage-indexes API client.
 * @param options - Optional pagination parameters (limit, paginationToken).
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export const listPreviewRestoreJobs = async (
  api: ManageIndexesApi,
  options?: PreviewListRestoreJobsOptions,
): Promise<RestoreJobList> => {
  try {
    return await api.listRestoreJobs({
      limit: options?.limit,
      paginationToken: options?.paginationToken,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing restore jobs: ${rawMessageText}`,
    );
  }
};
