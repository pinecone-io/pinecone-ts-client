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
 * Provides access to alpha control-plane index operations using the 2026-01.alpha API.
 *
 * Access via `pc.preview.indexes`.
 *
 * **Alpha notice:** This class is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export class PreviewIndexes {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = alphaIndexOperationsBuilder(config);
  }

  /**
   * Lists all indexes in the project.
   *
   * **Alpha notice:** Returns `AlphaIndexList` which includes `schema` fields not
   * present in the stable `IndexList`.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async listIndexes(): Promise<IndexList> {
    return listPreviewIndexes(this._api);
  }

  /**
   * Creates a schema-based index using the 2026-01.alpha API.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async createIndex(options: PreviewCreateIndexOptions): Promise<IndexModel> {
    return createPreviewIndex(this._api, options);
  }

  /**
   * Describes an index by name using the 2026-01.alpha API.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async describeIndex(indexName: string): Promise<IndexModel> {
    return describePreviewIndex(this._api, indexName);
  }

  /**
   * Deletes an alpha index by name.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward
   * compatibility guarantee.
   *
   * Deletion is asynchronous; the index may still be terminating after
   * this call returns. Deletion protection must be disabled before calling
   * this method.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async deleteIndex(name: string): Promise<void> {
    return deletePreviewIndex(this._api, name);
  }

  /**
   * Configures an alpha index by name.
   *
   * Only the fields present in `options` are updated; omit a field to leave it unchanged.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async configureIndex(
    name: string,
    options: PreviewConfigureIndexOptions,
  ): Promise<IndexModel> {
    return configurePreviewIndex(this._api, name, options);
  }

  /**
   * Creates a backup of an alpha index.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
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
   * Lists all backups for an alpha index.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @param indexName - Name of the index whose backups to list.
   * @param options - Optional pagination parameters (limit, paginationToken).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async listIndexBackups(
    indexName: string,
    options?: PreviewListIndexBackupsOptions,
  ): Promise<BackupList> {
    return listPreviewIndexBackups(this._api, indexName, options);
  }

  /**
   * Lists all backups across every index in the project using the 2026-01.alpha API.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
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
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
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
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
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
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @param backupId - The ID of the backup to create an index from.
   * @param options - Configuration for the new index (name required; tags and
   *   deletionProtection optional).
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async createIndexFromBackup(
    backupId: string,
    options: PreviewCreateIndexFromBackupOptions,
  ): Promise<CreateIndexFromBackupResponse> {
    return createIndexFromBackup(this._api, backupId, options);
  }

  /**
   * Lists all restore jobs for the current project.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
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
   * Describes a restore job by ID using the alpha API.
   *
   * Use this to poll the status of an index restore initiated by {@link createIndexFromBackup}.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @param jobId - The restore job ID returned by {@link createIndexFromBackup}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async describeRestoreJob(jobId: string): Promise<RestoreJobModel> {
    return describePreviewRestoreJob(this._api, jobId);
  }

  /**
   * Lists all collections in the current project using the 2026-01.alpha API.
   *
   * Collections are only supported for pod-based indexes; serverless indexes
   * do not support collections.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward
   * compatibility guarantee.
   *
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async listCollections(): Promise<CollectionList> {
    return listPreviewCollections(this._api);
  }

  /**
   * Creates a collection from a pod-based index using the 2026-01.alpha API.
   *
   * Collections snapshot the current state of a pod-based index. Serverless
   * indexes do not support collections.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward
   * compatibility guarantee.
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
   * Retrieves metadata for a single named collection using the 2026-01.alpha API.
   *
   * Collections are only supported for pod-based indexes; serverless indexes
   * do not support collections.
   *
   * **Alpha notice:** This method is not covered by the SDK's backward
   * compatibility guarantee.
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
   * **Alpha notice:** This method is not covered by the SDK's backward
   * compatibility guarantee.
   *
   * @param collectionName - The name of the collection to delete.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections)
   * @alpha
   */
  async deleteCollection(collectionName: string): Promise<void> {
    return deletePreviewCollection(this._api, collectionName);
  }
}
