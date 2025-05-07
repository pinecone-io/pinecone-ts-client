import {
  BackupModel,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for creating an index backup.
 */
export interface CreateBackupOptions {
  indexName: string;
  name?: string;
  description?: string;
}

export const createBackup = (api: ManageIndexesApi) => {
  return async (
    createBackupOptions: CreateBackupOptions
  ): Promise<BackupModel> => {
    if (!createBackupOptions.indexName) {
      throw new Error(
        'You must pass a non-empty string for `indexName` in order to create a backup'
      );
    }

    return await api.createBackup({
      indexName: createBackupOptions.indexName,
      createBackupRequest: {
        name: createBackupOptions.name,
        description: createBackupOptions.description,
      },
    });
  };
};
