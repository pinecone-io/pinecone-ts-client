import type {
  ManageIndexesApi,
  IndexList,
  IndexModel,
  BackupModel,
  BackupList,
  CollectionList,
  CollectionModel,
  CreateIndexFromBackupResponse,
  RestoreJobList,
  RestoreJobModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import type { PineconeConfiguration } from '../../data';
import { alphaIndexOperationsBuilder } from './alphaIndexOperationsBuilder';
import { listPreviewIndexes } from './listIndexes';
import { createPreviewIndex, PreviewCreateIndexOptions } from './createIndex';
import { describePreviewIndex } from './describeIndex';
import { deletePreviewIndex } from './deleteIndex';
import {
  configurePreviewIndex,
  PreviewConfigureIndexOptions,
} from './configureIndex';
import {
  createPreviewBackup,
  PreviewCreateBackupOptions,
} from './createBackup';
import {
  listPreviewIndexBackups,
  PreviewListIndexBackupsOptions,
} from './listIndexBackups';
import {
  listPreviewProjectBackups,
  PreviewListProjectBackupsOptions,
} from './listProjectBackups';
import { describePreviewBackup } from './describeBackup';
import { deletePreviewBackup } from './deleteBackup';
import {
  createIndexFromBackup,
  PreviewCreateIndexFromBackupOptions,
} from './createIndexFromBackup';
import {
  listPreviewRestoreJobs,
  PreviewListRestoreJobsOptions,
} from './listRestoreJobs';
import { describePreviewRestoreJob } from './describeRestoreJob';
import { listPreviewCollections } from './listCollections';
import {
  createPreviewCollection,
  PreviewCreateCollectionOptions,
} from './createCollection';
import { describePreviewCollection } from './describeCollection';
import { deletePreviewCollection } from './deleteCollection';

/**
 * Control-plane index operations. Access via `pc.preview.indexes`.
 *
 * Uses Pinecone API version `2026-01.alpha`.
 * Preview surface is not covered by SemVer — signatures and behavior
 * may change in any minor SDK release. Pin your SDK version when
 * relying on preview features.
 *
 * @alpha
 */
export class PreviewIndexes {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = alphaIndexOperationsBuilder(config);
  }

  /**
   * Lists all indexes in the project. The returned list includes `schema`
   * fields not present in the stable `IndexList`.
   *
   * @alpha
   */
  async list(): Promise<IndexList> {
    return listPreviewIndexes(this._api);
  }

  /**
   * Creates a schema-based index.
   *
   * @alpha
   */
  async create(options: PreviewCreateIndexOptions): Promise<IndexModel> {
    return createPreviewIndex(this._api, options);
  }

  /**
   * Describes an index by name.
   *
   * @alpha
   */
  async describe(indexName: string): Promise<IndexModel> {
    return describePreviewIndex(this._api, indexName);
  }

  /**
   * Deletes an index by name.
   *
   * Deletion is asynchronous; the index may still be terminating after
   * this call returns. Deletion protection must be disabled before calling
   * this method.
   *
   * @alpha
   */
  async delete(name: string): Promise<void> {
    return deletePreviewIndex(this._api, name);
  }

  /**
   * Configures an index by name.
   *
   * Only the fields present in `options` are updated; omit a field to leave it unchanged.
   *
   * @alpha
   */
  async configure(
    name: string,
    options: PreviewConfigureIndexOptions,
  ): Promise<IndexModel> {
    return configurePreviewIndex(this._api, name, options);
  }

  /**
   * Creates a backup of an index.
   *
   * @param indexName - Name of the index to back up.
   * @param options - Optional backup configuration (name, description).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async createBackup(
    indexName: string,
    options?: PreviewCreateBackupOptions,
  ): Promise<BackupModel> {
    return createPreviewBackup(this._api, indexName, options);
  }

  /**
   * Lists all backups for an index.
   *
   * @param indexName - Name of the index whose backups to list.
   * @param options - Optional pagination parameters (limit, paginationToken).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async listBackups(
    indexName: string,
    options?: PreviewListIndexBackupsOptions,
  ): Promise<BackupList> {
    return listPreviewIndexBackups(this._api, indexName, options);
  }

  /**
   * Lists all backups across every index in the project.
   *
   * @param options - Optional pagination parameters (limit, paginationToken).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async listProjectBackups(
    options?: PreviewListProjectBackupsOptions,
  ): Promise<BackupList> {
    return listPreviewProjectBackups(this._api, options);
  }

  /**
   * Retrieves configuration and status of a backup.
   *
   * @param backupId - The ID of the backup to describe.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async describeBackup(backupId: string): Promise<BackupModel> {
    return describePreviewBackup(this._api, backupId);
  }

  /**
   * Deletes a backup. The delete is accepted asynchronously.
   *
   * @param backupId - The ID of the backup to delete.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async deleteBackup(backupId: string): Promise<void> {
    return deletePreviewBackup(this._api, backupId);
  }

  /**
   * Creates an index from a backup. The creation is accepted asynchronously;
   * use the returned `restore_job_id` to poll for completion.
   *
   * @param backupId - The ID of the backup to create an index from.
   * @param options - Configuration for the new index (name required; tags and
   *   deletionProtection optional).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async createFromBackup(
    backupId: string,
    options: PreviewCreateIndexFromBackupOptions,
  ): Promise<CreateIndexFromBackupResponse> {
    return createIndexFromBackup(this._api, backupId, options);
  }

  /**
   * Lists all restore jobs for the current project.
   *
   * @param options - Optional pagination parameters (limit, paginationToken).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async listRestoreJobs(
    options?: PreviewListRestoreJobsOptions,
  ): Promise<RestoreJobList> {
    return listPreviewRestoreJobs(this._api, options);
  }

  /**
   * Describes a restore job by ID.
   *
   * Use this to poll the status of an index restore initiated by {@link createIndexFromBackup}.
   *
   * @param jobId - The restore job ID returned by {@link createIndexFromBackup}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async describeRestoreJob(jobId: string): Promise<RestoreJobModel> {
    return describePreviewRestoreJob(this._api, jobId);
  }

  /**
   * Lists all collections in the current project.
   *
   * Collections are only supported for pod-based indexes; serverless indexes
   * do not support collections.
   *
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async listCollections(): Promise<CollectionList> {
    return listPreviewCollections(this._api);
  }

  /**
   * Creates a collection from a pod-based index.
   *
   * Collections snapshot the current state of a pod-based index. Serverless
   * indexes do not support collections.
   *
   * @param options - Collection name and source index name.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async createCollection(
    options: PreviewCreateCollectionOptions,
  ): Promise<CollectionModel> {
    return createPreviewCollection(this._api, options);
  }

  /**
   * Retrieves metadata for a single named collection.
   *
   * Collections are only supported for pod-based indexes; serverless indexes
   * do not support collections.
   *
   * @param collectionName - The name of the collection to describe.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async describeCollection(collectionName: string): Promise<CollectionModel> {
    return describePreviewCollection(this._api, collectionName);
  }

  /**
   * Deletes an existing collection.
   *
   * @param collectionName - The name of the collection to delete.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections)
   * @alpha
   */
  async deleteCollection(collectionName: string): Promise<void> {
    return deletePreviewCollection(this._api, collectionName);
  }
}
