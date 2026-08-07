import type {
  ManageIndexesApi,
  RestoreJobModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type { RestoreJobModel } from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Describes a restore job by ID.
 *
 * @param api - The manage-indexes API client.
 * @param jobId - The ID of the restore job to describe.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export const describeRestoreJob = async (
  api: ManageIndexesApi,
  jobId: string,
): Promise<RestoreJobModel> => {
  if (!jobId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `jobId` in order to describe a restore job.',
    );
  }

  try {
    return await api.describeRestoreJob({
      jobId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error describing restore job ${jobId}: ${rawMessageText}`,
    );
  }
};
