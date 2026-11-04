import type {
  ManageIndexesApi,
  CreateIndexFromBackupResponse,
  RestoreDeploymentRequest,
} from '../../pinecone-generated-ts-fetch/db_control';
import { normalizeReadCapacity } from '../indexes/legacyTranslation';
import type { CreateIndexReadCapacity } from '../indexes/legacyTypes';
import type { ReadCapacity, DeletionProtection } from '../types';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  CreateIndexFromBackupResponse,
  RestoreDeploymentRequest,
} from '../../pinecone-generated-ts-fetch/db_control';

const RESTORE_DEPLOYMENT_TYPES: ReadonlyArray<string> = ['managed', 'byoc'];

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
  /**
   * Where to create the index. Omit to restore where the backup was taken: the same cloud and region for a serverless
   * backup, or the same environment for a BYOC backup. To restore a serverless backup into another region of the same
   * cloud, pass a `managed` deployment in that region. Cross-cloud restore is not supported, a serverless backup cannot
   * be restored into a BYOC environment, and a BYOC backup can only be restored into the environment it was taken in.
   */
  deployment?: RestoreDeploymentRequest;
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
  if (
    options.deployment != null &&
    !RESTORE_DEPLOYMENT_TYPES.includes(options.deployment.deploymentType)
  ) {
    throw new PineconeArgumentError(
      `\`deployment.deploymentType\` must be 'managed' or 'byoc' to create an index from a backup; received ${JSON.stringify(options.deployment.deploymentType)}.`,
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
        deployment: options.deployment,
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
