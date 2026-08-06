import type {
  ManageIndexesApi,
  BackupModel,
  BackupList,
  CreateIndexFromBackupResponse,
} from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { createBackup, CreateBackupOptions } from './createBackup';
import { listIndexBackups, ListIndexBackupsOptions } from './listIndexBackups';
import {
  listProjectBackups,
  ListProjectBackupsOptions,
} from './listProjectBackups';
import { describeBackup } from './describeBackup';
import { deleteBackup } from './deleteBackup';
import {
  createIndexFromBackup,
  CreateIndexFromBackupOptions,
} from './createIndexFromBackup';

/**
 * Control-plane operations for index backups.
 * Access via `pc.backups`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const backups = await pc.backups.list();
 * ```
 *
 * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
 */
export class Backups {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Creates a backup of an index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backup = await pc.backups.create('my-schema-index', {
   *   name: 'my-schema-index-backup-1',
   *   description: 'weekly backup',
   * });
   * console.log(backup);
   * // {
   * //   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //   sourceIndexName: 'my-schema-index',
   * //   name: 'my-schema-index-backup-1',
   * //   description: 'weekly backup',
   * //   status: 'Initializing',
   * //   cloud: 'aws',
   * //   region: 'us-east-1',
   * // }
   * ```
   *
   * @param indexName - Name of the index to back up.
   * @param options - Optional {@link CreateBackupOptions} for the backup (name, description).
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupModel}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async create(
    indexName: string,
    options?: CreateBackupOptions,
  ): Promise<BackupModel> {
    return createBackup(this._api, indexName, options);
  }

  /**
   * Lists all backups for a specific index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backupList = await pc.backups.listByIndex('my-schema-index', { limit: 10 });
   * console.log(backupList);
   * // {
   * //   data: [
   * //     {
   * //       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //       sourceIndexName: 'my-schema-index',
   * //       name: 'my-schema-index-backup-1',
   * //       status: 'Ready',
   * //       createdAt: '2025-05-07T03:11:11.722Z'
   * //     }
   * //   ],
   * //   pagination: undefined
   * // }
   * ```
   *
   * @param indexName - Name of the index whose backups to list.
   * @param options - Optional {@link ListIndexBackupsOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupList}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async listByIndex(
    indexName: string,
    options?: ListIndexBackupsOptions,
  ): Promise<BackupList> {
    return listIndexBackups(this._api, indexName, options);
  }

  /**
   * Lists all backups across every index in the project.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backupList = await pc.backups.list({ limit: 5 });
   * console.log(backupList);
   * // {
   * //   data: [
   * //     {
   * //       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //       sourceIndexName: 'my-schema-index',
   * //       name: 'my-schema-index-backup-1',
   * //       status: 'Ready',
   * //       createdAt: '2025-05-07T03:11:11.722Z'
   * //     }
   * //   ],
   * //   pagination: undefined
   * // }
   * ```
   *
   * @param options - Optional {@link ListProjectBackupsOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupList}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async list(options?: ListProjectBackupsOptions): Promise<BackupList> {
    return listProjectBackups(this._api, options);
  }

  /**
   * Retrieves the configuration and status of a backup.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backup = await pc.backups.describe('11450b9f-96e5-47e5-9186-03f346b1f385');
   * console.log(backup);
   * // {
   * //   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //   sourceIndexName: 'my-schema-index',
   * //   name: 'my-schema-index-backup-1',
   * //   description: 'weekly backup',
   * //   status: 'Ready',
   * //   cloud: 'aws',
   * //   region: 'us-east-1',
   * //   createdAt: '2025-05-07T03:11:11.722Z'
   * // }
   * ```
   *
   * @param backupId - The ID of the backup to describe.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupModel}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async describe(backupId: string): Promise<BackupModel> {
    return describeBackup(this._api, backupId);
  }

  /**
   * Deletes a backup. The deletion is accepted asynchronously.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.backups.delete('11450b9f-96e5-47e5-9186-03f346b1f385');
   * ```
   *
   * @param backupId - The ID of the backup to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is accepted.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async delete(backupId: string): Promise<void> {
    return deleteBackup(this._api, backupId);
  }

  /**
   * Creates an index from a backup. The creation is accepted asynchronously.
   * Use the returned `restoreJobId` with {@link describeRestoreJob} to poll for completion.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const response = await pc.backups.createIndex(
   *   '11450b9f-96e5-47e5-9186-03f346b1f385',
   *   { name: 'my-schema-index-restored' },
   * );
   * console.log(response);
   * // {
   * //   restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
   * //   indexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe'
   * // }
   *
   * // Poll until the restore completes
   * const job = await pc.indexes.describeRestoreJob('4d4c8693-10fd-4204-a57b-1e3e626fca07');
   * console.log(job.status);
   * // 'Completed'
   * ```
   *
   * @param backupId - The ID of the backup to restore from.
   * @param options - The {@link CreateIndexFromBackupOptions} for the new index (name required; tags and deletionProtection optional).
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CreateIndexFromBackupResponse} containing the `restoreJobId` and `indexId`.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async createIndex(
    backupId: string,
    options: CreateIndexFromBackupOptions,
  ): Promise<CreateIndexFromBackupResponse> {
    return createIndexFromBackup(this._api, backupId, options);
  }
}
