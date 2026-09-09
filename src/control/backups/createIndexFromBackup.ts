import type {
  ManageIndexesApi,
  CreateIndexFromBackupResponse,
} from '../../pinecone-generated-ts-fetch/db_control';
import { normalizeReadCapacity } from '../indexes/legacyTranslation';
import type { CreateIndexReadCapacity } from '../indexes/legacyTypes';
import type { ReadCapacity, DeletionProtection } from '../types';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type { CreateIndexFromBackupResponse } from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Options for the deprecated flat backup restore method.
 *
 * @deprecated Use {@link CreateIndexFromBackupResourceOptions} with {@link Backups.createIndex}.
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export interface CreateIndexFromBackupOptions {
  /** The ID of the backup to restore. */
  backupId: string;
  /** The new index name, such as `product-catalog-restored`. Must be unique within the project. */
  name: string;
  /** Optional tags to apply to the created index. Overrides backup tags if provided. */
  tags?: Record<string, string>;
  /** Whether to enable deletion protection on the created index. */
  deletionProtection?: DeletionProtection;
  /** Native nested or deprecated flat read capacity configuration. Omit for on-demand capacity. */
  readCapacity?: ReadCapacity | CreateIndexReadCapacity;
}

/** Options for {@link Backups.createIndex}; pass the backup ID separately. */
export type CreateIndexFromBackupResourceOptions = Omit<
  CreateIndexFromBackupOptions,
  'backupId'
>;

/**
 * Creates an index from a Pinecone backup.
 *
 * The creation is accepted asynchronously — returns a `restoreJobId` and
 * `indexId` once the request is accepted (HTTP 202). Poll the restore job
 * to track completion.
 *
 * @param api - The manage-indexes API client.
 * @param backupId - The ID of the backup to create an index from.
 * @param options - Configuration for the new index.
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export const createIndexFromBackup = async (
  api: ManageIndexesApi,
  backupId: string,
  options: CreateIndexFromBackupResourceOptions,
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
  const readCapacity = normalizeReadCapacity(options.readCapacity);
  try {
    return await api.createIndexFromBackupOperation({
      backupId,
      createIndexFromBackupRequest: {
        name: options.name,
        tags: options.tags,
        deletionProtection: options.deletionProtection,
        readCapacity,
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
