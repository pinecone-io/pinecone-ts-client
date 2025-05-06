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
