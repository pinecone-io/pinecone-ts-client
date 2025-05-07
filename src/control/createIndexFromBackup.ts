import {
  CreateIndexFromBackupResponse,
  DeletionProtection,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for creating an index from backup.
 */
export interface CreateIndexFromBackupOptions {
  backupId: string;
  name: string;
  tags?: { [key: string]: string };
  deletionProtection?: DeletionProtection;
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

    return await api.createIndexFromBackup({
      backupId: createIndexFromBackupOptions.backupId,
      createIndexFromBackupRequest: {
        name: createIndexFromBackupOptions.name,
        tags: createIndexFromBackupOptions.tags,
        deletionProtection: createIndexFromBackupOptions.deletionProtection,
      },
    });
  };
};
