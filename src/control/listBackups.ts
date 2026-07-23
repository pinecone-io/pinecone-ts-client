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
  /**
   * Only applies when `indexName` is provided. When `true`, returns backups from every index in the project that
   * has ever used this name, including deleted indexes. When `false` or omitted, `indexName` must resolve to an
   * active index or the API returns a 404. Ignored when listing all project backups.
   */
  includeDeleted?: boolean;
}

export const listBackups = (api: ManageIndexesApi) => {
  return async (
    listBackupOptions: ListBackupsOptions = {},
  ): Promise<BackupList> => {
    const { indexName, includeDeleted, ...rest } = listBackupOptions;
    if (!indexName) {
      // `includeDeleted` is not a valid parameter when listing all project
      // backups, so it is intentionally excluded here.
      return await api.listProjectBackups({
        ...rest,
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    } else {
      return await api.listIndexBackups({
        indexName,
        includeDeleted,
        ...rest,
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    }
  };
};
