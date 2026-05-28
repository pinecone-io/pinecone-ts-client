import type {
  ManageIndexesApi,
  BackupModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type { BackupModel as PreviewBackupModel } from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Retrieves the configuration and status of a Pinecone backup using the 2026-01.alpha API.
 *
 * @param api - The alpha manage-indexes API client.
 * @param backupId - The ID of the backup to describe.
 * @returns A promise that resolves to the BackupModel for the specified backup.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export async function describePreviewBackup(
  api: ManageIndexesApi,
  backupId: string,
): Promise<BackupModel> {
  if (!backupId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `backupId` in order to describe a backup.',
    );
  }
  try {
    return await api.describeBackup({
      backupId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error describing backup ${backupId}: ${rawMessageText}`,
    );
  }
}
