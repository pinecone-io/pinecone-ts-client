import type {
  ManageIndexesApi,
  CreateIndexFromBackupResponse,
} from '../../pinecone-generated-ts-fetch/db_control';
import type { BackupModel } from './describeBackup';
import type { BackupList } from './listIndexBackups';
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
 * Backups preserve index data for restoration into a new index.
 * Access them through {@link Pinecone.backups}; do not construct this class directly.
 * Use {@link Collections} for snapshots of pod-based indexes.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * const backups = await pc.backups.list();
 * ```
 */
export class Backups {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Starts creating a backup of an index.
   *
   * @param indexName - The index to back up, such as `product-catalog`.
   * @param options - An optional name and description to help identify the backup.
   * @returns The backup ID, source index, and current status; creation can still be in progress.
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const backup = await pc.backups.create('product-catalog', {
   *   name: 'catalog-weekly',
   *   description: 'Before the autumn catalog refresh',
   * });
   * console.log(backup.backupId, backup.status);
   * ```
   */
  async create(
    indexName: string,
    options?: CreateBackupOptions,
  ): Promise<BackupModel> {
    return createBackup(this._api, indexName, options);
  }

  /**
   * Lists one page of backups for an index.
   *
   * @param indexName - The source index name, such as `product-catalog`.
   * @param options - Pagination settings; set `includeDeleted` to include backups of deleted indexes with this name.
   * @returns The backups in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const page = await pc.backups.listByIndex('product-catalog', { limit: 10 });
   * console.log(page.data, page.pagination?.next);
   * ```
   *
   * @see {@link Backups.list} to list backups across the project.
   */
  async listByIndex(
    indexName: string,
    options?: ListIndexBackupsOptions,
  ): Promise<BackupList> {
    return listIndexBackups(this._api, indexName, options);
  }

  /**
   * Lists one page of backups across the project.
   *
   * @param options - Page size and continuation token. Omit to fetch the first page with the default size.
   * @returns The backups in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const page = await pc.backups.list({ limit: 10 });
   * console.log(page.data, page.pagination?.next);
   * ```
   *
   * @see {@link Backups.listByIndex} to list backups for a named index.
   */
  async list(options?: ListProjectBackupsOptions): Promise<BackupList> {
    return listProjectBackups(this._api, options);
  }

  /**
   * Retrieves the configuration and status of a backup.
   *
   * @param backupId - The ID returned when the backup was created or listed.
   * @returns The backup ID, source index, and current status.
   * @throws {@link Errors.PineconeArgumentError} when the backup ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const backup = await pc.backups.describe('11450b9f-96e5-47e5-9186-03f346b1f385');
   * console.log(backup.status);
   * ```
   */
  async describe(backupId: string): Promise<BackupModel> {
    return describeBackup(this._api, backupId);
  }

  /**
   * Deletes a backup.
   *
   * Deletion is asynchronous; the backup may remain visible briefly after this call returns.
   *
   * @param backupId - The ID of the backup to delete.
   * @returns Resolves when the deletion request is accepted.
   * @throws {@link Errors.PineconeArgumentError} when the backup ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.backups.delete('11450b9f-96e5-47e5-9186-03f346b1f385');
   * ```
   */
  async delete(backupId: string): Promise<void> {
    return deleteBackup(this._api, backupId);
  }

  /**
   * Starts restoring a backup into a new index.
   *
   * Use {@link RestoreJobs.describe} to check progress after this call returns.
   *
   * @param backupId - The ID of the backup to restore.
   * @param options - The new index name and optional tags, deletion protection, and read capacity.
   * @returns The `restoreJobId` for tracking progress and `indexId` of the new index.
   * @throws {@link Errors.PineconeArgumentError} when the backup ID or new index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const result = await pc.backups.createIndex(
   *   '11450b9f-96e5-47e5-9186-03f346b1f385',
   *   { name: 'product-catalog-restored' },
   * );
   * const job = await pc.restoreJobs.describe(result.restoreJobId);
   * console.log(job.status);
   * ```
   *
   * @see {@link Indexes.create} to create an empty index.
   */
  async createIndex(
    backupId: string,
    options: CreateIndexFromBackupOptions,
  ): Promise<CreateIndexFromBackupResponse> {
    return createIndexFromBackup(this._api, backupId, options);
  }
}
