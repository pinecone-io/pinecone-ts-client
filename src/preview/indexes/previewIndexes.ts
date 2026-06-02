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
 * Control-plane index operations for Pinecone's alpha API (`2026-01.alpha`).
 * Access via `pc.preview.indexes`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const list = await pc.preview.indexes.list();
 * ```
 *
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
   * fields not present in the stable API's {@link IndexList}.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexList = await pc.preview.indexes.list();
   * console.log(indexList);
   * // {
   * //   indexes: [
   * //     {
   * //       name: 'my-schema-index',
   * //       metric: 'cosine',
   * //       host: 'my-schema-index-abc123.svc.pinecone.io',
   * //       schema: {
   * //         fields: { chunk_text: { type: 'string', fullTextSearch: {} } }
   * //       },
   * //       status: { ready: true, state: 'Ready' }
   * //     }
   * //   ]
   * // }
   * ```
   *
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexList}.
   * @alpha
   */
  async list(): Promise<IndexList> {
    return listPreviewIndexes(this._api);
  }

  /**
   * Creates a schema-based index using the `2026-01.alpha` API.
   *
   * The `schema` object defines the fields stored in each document. At least one
   * primary field (`dense_vector`, `sparse_vector`, `semantic_text`, or a `string`
   * field with `fullTextSearch`) must be present.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.preview.indexes.create({
   *   name: 'my-schema-index',
   *   schema: {
   *     fields: {
   *       chunk_text: { type: 'string', fullTextSearch: {} },
   *     },
   *   },
   *   waitUntilReady: true,
   * });
   * console.log(indexModel.name);
   * // 'my-schema-index'
   * ```
   *
   * @param options - The {@link PreviewCreateIndexOptions} for creating the index, including `name`, `schema`, and optional `waitUntilReady` and `timeout`.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters or project quotas.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in the project.
   * @returns A promise that resolves to {@link IndexModel} when the creation request is accepted. Use `waitUntilReady: true` to block until the index is ready for data operations.
   * @alpha
   */
  async create(options: PreviewCreateIndexOptions): Promise<IndexModel> {
    return createPreviewIndex(this._api, options);
  }

  /**
   * Describes an index by name, returning its configuration, schema, and status.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.preview.indexes.describe('my-schema-index');
   * console.log(indexModel);
   * // {
   * //   name: 'my-schema-index',
   * //   metric: 'cosine',
   * //   host: 'my-schema-index-abc123.svc.pinecone.io',
   * //   schema: {
   * //     fields: { chunk_text: { type: 'string', fullTextSearch: {} } }
   * //   },
   * //   status: { ready: true, state: 'Ready' }
   * // }
   * ```
   *
   * @param indexName - The name of the index to describe.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexModel}.
   * @alpha
   */
  async describe(indexName: string): Promise<IndexModel> {
    return describePreviewIndex(this._api, indexName);
  }

  /**
   * Deletes an index by name.
   *
   * Deletion is asynchronous; the index may still be terminating after this call returns.
   * Deletion protection must be disabled before calling this method.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.preview.indexes.delete('my-schema-index');
   * ```
   *
   * @param name - The name of the index to delete.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is accepted.
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.preview.indexes.configure('my-schema-index', {
   *   deletion_protection: 'enabled',
   *   tags: { team: 'ml-platform' },
   * });
   * console.log(indexModel.name);
   * // 'my-schema-index'
   * ```
   *
   * @param name - The name of the index to configure.
   * @param options - The {@link PreviewConfigureIndexOptions} fields to update. Only provided fields are changed.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to the updated {@link IndexModel}.
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backup = await pc.preview.indexes.createBackup('my-schema-index', {
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
   * @param options - Optional {@link PreviewCreateBackupOptions} for the backup (name, description).
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupModel}.
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
   * Lists all backups for a specific index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backupList = await pc.preview.indexes.listBackups('my-schema-index', { limit: 10 });
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
   * @param options - Optional {@link PreviewListIndexBackupsOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupList}.
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backupList = await pc.preview.indexes.listProjectBackups({ limit: 5 });
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
   * @param options - Optional {@link PreviewListProjectBackupsOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link BackupList}.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async listProjectBackups(
    options?: PreviewListProjectBackupsOptions,
  ): Promise<BackupList> {
    return listPreviewProjectBackups(this._api, options);
  }

  /**
   * Retrieves the configuration and status of a backup.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backup = await pc.preview.indexes.describeBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
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
   * @alpha
   */
  async describeBackup(backupId: string): Promise<BackupModel> {
    return describePreviewBackup(this._api, backupId);
  }

  /**
   * Deletes a backup. The deletion is accepted asynchronously.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.preview.indexes.deleteBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
   * ```
   *
   * @param backupId - The ID of the backup to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is accepted.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   * @alpha
   */
  async deleteBackup(backupId: string): Promise<void> {
    return deletePreviewBackup(this._api, backupId);
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
   * const response = await pc.preview.indexes.createFromBackup(
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
   * const job = await pc.preview.indexes.describeRestoreJob('4d4c8693-10fd-4204-a57b-1e3e626fca07');
   * console.log(job.status);
   * // 'Completed'
   * ```
   *
   * @param backupId - The ID of the backup to restore from.
   * @param options - The {@link PreviewCreateIndexFromBackupOptions} for the new index (name required; tags and deletionProtection optional).
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CreateIndexFromBackupResponse} containing the `restoreJobId` and `indexId`.
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const restoreJobs = await pc.preview.indexes.listRestoreJobs({ limit: 3 });
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
   * @param options - Optional {@link PreviewListRestoreJobsOptions} pagination parameters (limit, paginationToken).
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link RestoreJobList}.
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
   * Use this to poll the status of an index restore initiated by {@link createFromBackup}.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const job = await pc.preview.indexes.describeRestoreJob('4d4c8693-10fd-4204-a57b-1e3e626fca07');
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collectionList = await pc.preview.indexes.listCollections();
   * console.log(collectionList);
   * // {
   * //   collections: [
   * //     {
   * //       name: 'my-collection',
   * //       size: 10000000,
   * //       status: 'Ready',
   * //       dimension: 1536,
   * //       recordCount: 120000,
   * //       source: 'my-pod-index'
   * //     }
   * //   ]
   * // }
   * ```
   *
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionList}.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async listCollections(): Promise<CollectionList> {
    return listPreviewCollections(this._api);
  }

  /**
   * Creates a collection from a pod-based index.
   *
   * Collections snapshot the current state of a pod-based index and can be used
   * to create new indexes. Serverless indexes do not support collections.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collection = await pc.preview.indexes.createCollection({
   *   name: 'my-collection',
   *   source: 'my-pod-index',
   * });
   * console.log(collection);
   * // {
   * //   name: 'my-collection',
   * //   status: 'Initializing',
   * //   source: 'my-pod-index'
   * // }
   * ```
   *
   * @param options - The {@link PreviewCreateCollectionOptions} for the collection, including `name` and `source` index name.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionModel}.
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collection = await pc.preview.indexes.describeCollection('my-collection');
   * console.log(collection);
   * // {
   * //   name: 'my-collection',
   * //   size: 10000000,
   * //   status: 'Ready',
   * //   dimension: 1536,
   * //   recordCount: 120000,
   * //   source: 'my-pod-index'
   * // }
   * ```
   *
   * @param collectionName - The name of the collection to describe.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionModel}.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async describeCollection(collectionName: string): Promise<CollectionModel> {
    return describePreviewCollection(this._api, collectionName);
  }

  /**
   * Deletes an existing collection by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.preview.indexes.deleteCollection('my-collection');
   * ```
   *
   * @param collectionName - The name of the collection to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is completed.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   * @alpha
   */
  async deleteCollection(collectionName: string): Promise<void> {
    return deletePreviewCollection(this._api, collectionName);
  }
}
