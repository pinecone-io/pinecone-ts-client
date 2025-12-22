import {
  BackupModel,
  ManageIndexesApi,
  CreateBackupOperationRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import { withControlApiVersion } from './apiVersion';

/**
 * The options for creating an index backup.
 */
export interface CreateBackupOptions {
  /**
   * The name of the index to back up.
   */
  indexName: string;
  /**
   * An optional name for the backup. If not provided, one will be auto-generated.
   */
  name?: string;
  /**
   * A human-readable description of the backup's purpose or contents.
   */
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

    return await api.createBackup(
      withControlApiVersion<CreateBackupOperationRequest>({
        indexName: createBackupOptions.indexName,
        createBackupRequest: {
          name: createBackupOptions.name,
          description: createBackupOptions.description,
        },
      })
    );
  };
};
