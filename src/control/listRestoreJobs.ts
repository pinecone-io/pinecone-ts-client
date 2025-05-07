import {
  ManageIndexesApi,
  RestoreJobList,
} from '../pinecone-generated-ts-fetch/db_control';

/**
 * The options for listing restore jobs.
 */
export interface ListRestoreJobsOptions {
  /**
   * Maximum number of restore jobs to return.
   */
  limit?: number;
  /**
   * Token used for pagination to retrieve the next page of results.
   */
  paginationToken?: string;
}

export const listRestoreJobs = (api: ManageIndexesApi) => {
  return async (
    listBackupOptions: ListRestoreJobsOptions
  ): Promise<RestoreJobList> => {
    return await api.listRestoreJobs(listBackupOptions);
  };
};
