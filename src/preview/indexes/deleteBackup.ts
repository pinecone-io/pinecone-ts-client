import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Deletes a Pinecone backup using the alpha API.
 *
 * The delete is accepted asynchronously — the backup may not be removed immediately.
 * Returns once the delete request is accepted (HTTP 202).
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility guarantee.
 *
 * @param api - The alpha manage-indexes API client.
 * @param backupId - The ID of the backup to delete.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export const deletePreviewBackup = async (
  api: ManageIndexesApi,
  backupId: string,
): Promise<void> => {
  if (!backupId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `backupId` in order to delete a backup.',
    );
  }
  try {
    await api.deleteBackup({
      backupId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error deleting backup ${backupId}: ${rawMessageText}`,
    );
  }
};
