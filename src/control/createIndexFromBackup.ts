import {
  CreateIndexFromBackupResponse,
  X_PINECONE_API_VERSION,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for creating a new index from an existing backup.
 */
export interface CreateIndexFromBackupOptions {
  /**
   * The ID of the backup to restore from.
   */
  backupId: string;
  /**
   * The name of the new index to create from the backup. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
   */
  name: string;
  /**
   * Optional custom user tags to attach to the restored index. Keys must be 80 characters or less. Values must be 120 characters or less.
   * Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '.
   * To unset a key, set the value to be an empty string.
   */
  tags?: { [key: string]: string };
  /**
   * Allows configuring deletion protection for the new index: 'enabled' or 'disabled'. Defaults to 'disabled'.
   */
  deletionProtection?: string;
}

export const createIndexFromBackup = (api: ManageIndexesApi) => {
  return async (
    createIndexFromBackupOptions: CreateIndexFromBackupOptions
  ): Promise<CreateIndexFromBackupResponse> => {
    if (!createIndexFromBackupOptions.backupId) {
      throw new Error(
        'You must pass a non-empty string for `backupId` in order to create an index from backup'
      );
    } else if (!createIndexFromBackupOptions.name) {
      throw new Error(
        'You must pass a non-empty string for `name` in order to create an index from backup'
      );
    }

    return await api.createIndexFromBackupOperation({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      backupId: createIndexFromBackupOptions.backupId,
      createIndexFromBackupRequest: {
        name: createIndexFromBackupOptions.name,
        tags: createIndexFromBackupOptions.tags,
        deletionProtection: createIndexFromBackupOptions.deletionProtection,
      },
    });
  };
};
