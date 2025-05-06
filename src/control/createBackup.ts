import {
  BackupModel,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for creating an index backup.
 */
export interface CreateBackupOptions {
  indexName: string;
  name: string;
  description?: string;
}

export const createBackup = (api: ManageIndexesApi) => {
  return async (
    createBackupOptions: CreateBackupOptions
  ): Promise<BackupModel> => {
    return await api.createBackup({
      indexName: createBackupOptions.indexName,
      createBackupRequest: {
        name: createBackupOptions.name,
        description: createBackupOptions.description,
      },
    });
  };
};
