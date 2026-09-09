import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Deletes a backup schedule. Backups it already produced are kept until their
 * own retention window ends.
 *
 * @param api - The manage-indexes API client.
 * @param scheduleId - The ID of the schedule to delete.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export async function deleteBackupSchedule(
  api: ManageIndexesApi,
  scheduleId: string,
): Promise<void> {
  if (!scheduleId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `scheduleId` in order to delete a backup schedule.',
    );
  }
  try {
    await api.deleteBackupSchedule({
      scheduleId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error deleting backup schedule ${scheduleId}: ${rawMessageText}`,
    );
  }
}
