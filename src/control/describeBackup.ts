import {
  ManageIndexesApi,
  BackupModel,
  DescribeBackupRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import type { BackupId } from './types';
import { PineconeArgumentError } from '../errors';
import { withControlApiVersion } from './apiVersion';

/**
 * The string ID of the backup to describe.
 */
export type DescribeBackupOptions = BackupId;

export const describeBackup = (api: ManageIndexesApi) => {
  return async (backupId: DescribeBackupOptions): Promise<BackupModel> => {
    if (!backupId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `backupId` in order to describe a backup'
      );
    }

    return await api.describeBackup(
      withControlApiVersion<DescribeBackupRequest>({ backupId: backupId })
    );
  };
};
