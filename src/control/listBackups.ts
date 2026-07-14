import {
  ManageIndexesApi,
  BackupList,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for listing backups.
 */
export interface ListBackupsOptions {
  /**
   * The index name to list backups for. If not provided, all project backups will be listed.
   */
  indexName?: string;
  /**
   * Maximum number of backups to return.
   */
  limit?: number;
  /**
   * Token used for pagination to retrieve the next page of results.
   */
  paginationToken?: string;
}

export const listBackups = (api: ManageIndexesApi) => {
  return async (
    listBackupOptions: ListBackupsOptions = {},
  ): Promise<BackupList> => {
    const { indexName, ...rest } = listBackupOptions;
    if (!indexName) {
      return await api.listProjectBackups({
        ...rest,
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    } else {
      return await api.listIndexBackups({
        indexName,
        ...rest,
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    }
  };
};
