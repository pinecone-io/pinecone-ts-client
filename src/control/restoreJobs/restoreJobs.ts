import type {
  ManageIndexesApi,
  RestoreJobList,
  RestoreJobModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { listRestoreJobs, ListRestoreJobsOptions } from './listRestoreJobs';
import { describeRestoreJob } from './describeRestoreJob';

/**
 * Restore jobs track the creation of indexes from backups.
 * Access them through {@link Pinecone.restoreJobs}; do not construct this class directly.
 * Start a restore with {@link Backups.createIndex}.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * const jobs = await pc.restoreJobs.list();
 * ```
 */
export class RestoreJobs {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Lists one page of restore jobs in the project.
   *
   * @param options - Page size and continuation token. Omit to fetch the first page with the default size.
   * @returns Jobs in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const page = await pc.restoreJobs.list({ limit: 10 });
   * console.log(page.data, page.pagination?.next);
   * ```
   */
  async list(options?: ListRestoreJobsOptions): Promise<RestoreJobList> {
    return listRestoreJobs(this._api, options);
  }

  /**
   * Retrieves the current progress of a restore job.
   *
   * @param jobId - The `restoreJobId` returned by {@link Backups.createIndex}.
   * @returns The restore status, target index, and completion percentage.
   * @throws {@link Errors.PineconeArgumentError} when the restore job ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const job = await pc.restoreJobs.describe('4d4c8693-10fd-4204-a57b-1e3e626fca07');
   * console.log(job.status, job.percentComplete);
   * ```
   *
   * @see {@link Backups.createIndex} to start a restore.
   */
  async describe(jobId: string): Promise<RestoreJobModel> {
    return describeRestoreJob(this._api, jobId);
  }
}
