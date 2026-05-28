import type {
  ManageIndexesApi,
  BackupModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for creating a backup of an index.
 *
 * @alpha
 */
export interface PreviewCreateBackupOptions {
  /** Optional user-defined name for the backup. */
  name?: string;
  /** Optional description providing context for the backup. */
  description?: string;
}

/**
 * Creates a backup of an index using the 2026-01.alpha API.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export async function createPreviewBackup(
  api: ManageIndexesApi,
  indexName: string,
  options: PreviewCreateBackupOptions = {},
): Promise<BackupModel> {
  if (!indexName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `indexName` in order to create a backup.',
    );
  }
  try {
    return await api.createBackup({
      indexName,
      createBackupRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating backup for index ${indexName}: ${rawMessageText}`,
    );
  }
}
