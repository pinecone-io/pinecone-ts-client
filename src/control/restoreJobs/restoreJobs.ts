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
 * Control-plane operations for restore jobs, which track the progress of an
 * index being created from a backup. Access via `pc.restoreJobs`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const jobs = await pc.restoreJobs.list();
 * ```
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export class RestoreJobs {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Lists all restore jobs for the current project.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const restoreJobs = await pc.restoreJobs.list({ limit: 3 });
   * console.log(restoreJobs);
   * // {
   * //   data: [
   * //     {
   * //       restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
   * //       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //       targetIndexName: 'my-schema-index-restored',
   * //       status: 'Completed',
   * //       percentComplete: 100
   * //     }
   * //   ],
   * //   pagination: undefined
   * // }
   * ```
   *
   * @param options - Optional {@link ListRestoreJobsOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link RestoreJobList}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async list(options?: ListRestoreJobsOptions): Promise<RestoreJobList> {
    return listRestoreJobs(this._api, options);
  }

  /**
   * Describes a restore job by ID.
   *
   * Use this to poll the status of an index restore initiated by {@link createFromBackup}.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const job = await pc.restoreJobs.describe('4d4c8693-10fd-4204-a57b-1e3e626fca07');
   * console.log(job);
   * // {
   * //   restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
   * //   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //   targetIndexName: 'my-schema-index-restored',
   * //   targetIndexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe',
   * //   status: 'Completed',
   * //   percentComplete: 100
   * // }
   * ```
   *
   * @param jobId - The restore job ID returned by {@link createFromBackup}.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link RestoreJobModel}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async describe(jobId: string): Promise<RestoreJobModel> {
    return describeRestoreJob(this._api, jobId);
  }
}
