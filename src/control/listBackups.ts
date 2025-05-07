import {
  ManageIndexesApi,
  BackupList,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for listing backups.
 */
export interface ListBackupsOptions {
  indexName?: string;
  limit?: number;
  paginationToken?: string;
}

export const listBackups = (api: ManageIndexesApi) => {
  return async (
    listBackupOptions: ListBackupsOptions = {}
  ): Promise<BackupList> => {
    const { indexName, ...rest } = listBackupOptions;
    if (!indexName) {
      return await api.listProjectBackups();
    } else {
      return await api.listIndexBackups({ indexName, ...rest });
    }
  };
};
