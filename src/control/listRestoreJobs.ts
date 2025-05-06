import {
  ManageIndexesApi,
  RestoreJobList,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The limit and pagination token for the list of restore jobs.
 */
export interface ListRestoreJobsOptions {
  limit?: number;
  paginationToken?: string;
}

export const listRestoreJobs = (api: ManageIndexesApi) => {
  return async (
    listBackupOptions: ListRestoreJobsOptions
  ): Promise<RestoreJobList> => {
    return await api.listRestoreJobs(listBackupOptions);
  };
};
