import {
  X_PINECONE_API_VERSION,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';
import type { BackupId } from './types';
import { PineconeArgumentError } from '../errors';

/**
 * The string ID of the backup to delete.
 */
export type DeleteBackupOptions = BackupId;

export const deleteBackup = (api: ManageIndexesApi) => {
  return async (backupId: DeleteBackupOptions): Promise<void> => {
    if (!backupId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `backupId` in order to delete a backup'
      );
    }

    return await api.deleteBackup({
      backupId: backupId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
