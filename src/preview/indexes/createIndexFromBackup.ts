import type {
  ManageIndexesApi,
  CreateIndexFromBackupResponse,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for creating an index from a backup.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export interface PreviewCreateIndexFromBackupOptions {
  /** The name of the index to create. 1–45 characters, alphanumeric and '-'. */
  name: string;
  /** Optional tags to apply to the created index. Overrides backup tags if provided. */
  tags?: Record<string, string>;
  /** Whether to enable deletion protection on the created index. */
  deletionProtection?: string;
}

/**
 * Creates an index from a Pinecone backup using the 2026-01.alpha API.
 *
 * The creation is accepted asynchronously — returns a `restore_job_id` and
 * `index_id` once the request is accepted (HTTP 202). Poll the restore job
 * to track completion.
 *
 * @param api - The alpha manage-indexes API client.
 * @param backupId - The ID of the backup to create an index from.
 * @param options - Configuration for the new index.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 * @alpha
 */
export const createIndexFromBackup = async (
  api: ManageIndexesApi,
  backupId: string,
  options: PreviewCreateIndexFromBackupOptions,
): Promise<CreateIndexFromBackupResponse> => {
  if (!backupId) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `backupId` to create an index from a backup.',
    );
  }
  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` to create an index from a backup.',
    );
  }
  try {
    return await api.createIndexFromBackupOperation({
      backupId,
      createIndexFromBackupRequest: {
        name: options.name,
        tags: options.tags,
        deletion_protection: options.deletionProtection,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating index from backup ${backupId}: ${rawMessageText}`,
    );
  }
};
