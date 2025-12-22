import {
  DeleteBackupRequest,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';
import type { BackupId } from './types';
import { PineconeArgumentError } from '../errors';
import { withControlApiVersion } from './apiVersion';

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

    return await api.deleteBackup(
      withControlApiVersion<DeleteBackupRequest>({ backupId: backupId })
    );
  };
};
