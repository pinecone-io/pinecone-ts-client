import type {
  ManageIndexesApi,
  BackupList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for listing backups of an alpha index.
 *
 * **Alpha notice:** This type is not covered by the SDK's backward compatibility guarantee.
 *
 * @alpha
 */
export interface PreviewListIndexBackupsOptions {
  /** Maximum number of results to return per page (1–100, default: 10). */
  limit?: number;
  /** Pagination token from a prior response to retrieve the next page. */
  paginationToken?: string;
}

/**
 * Lists all backups for an alpha index using the 2026-01.alpha API.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export async function listPreviewIndexBackups(
  api: ManageIndexesApi,
  indexName: string,
  options: PreviewListIndexBackupsOptions = {},
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
