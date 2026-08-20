import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type { BackupModel } from './describeBackup';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for creating a backup of an index.
 *
 */
export interface CreateBackupOptions {
  /** Optional user-defined name for the backup. */
  name?: string;
  /** Optional description providing context for the backup. */
  description?: string;
}

/**
 * Creates a backup of an index.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function createBackup(
  api: ManageIndexesApi,
  indexName: string,
  options: CreateBackupOptions = {},
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
