import {
  ManageIndexesApi,
  RestoreJobModel,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import type { RestoreJobId } from './types';
import { PineconeArgumentError } from '../errors';

/**
 * The string ID of the restore job to describe.
 */
export type DescribeRestoreJobOptions = RestoreJobId;

export const describeRestoreJob = (api: ManageIndexesApi) => {
  return async (
    restoreJobId: DescribeRestoreJobOptions,
  ): Promise<RestoreJobModel> => {
    if (!restoreJobId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `restoreJobId` in order to describe a restore job',
      );
    }

    return await api.describeRestoreJob({
      jobId: restoreJobId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
