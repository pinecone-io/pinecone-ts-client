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
} from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { listIndexes } from './listIndexes';
import { createIndex, CreateIndexOptions } from './createIndex';
import {
  createIndexForModel,
  CreateIndexForModelOptions,
} from './createIndexForModel';
import { describeIndex } from './describeIndex';
import { deleteIndex } from './deleteIndex';
import { configureIndex, ConfigureIndexOptions } from './configureIndex';
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
import { listRestoreJobs, ListRestoreJobsOptions } from './listRestoreJobs';
import { describeRestoreJob } from './describeRestoreJob';
import { listCollections } from './listCollections';
import { createCollection, CreateCollectionOptions } from './createCollection';
import { describeCollection } from './describeCollection';
import { deleteCollection } from './deleteCollection';
import { IndexHostSingleton } from '../../data/indexHostSingleton';

/**
 * Control-plane index operations for Pinecone indexes, backups, restore jobs,
 * and collections.
 * Access via `pc.indexes`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const list = await pc.indexes.list();
 * ```
 *
 */
export class Indexes {
  private _api: ManageIndexesApi;
  private _config: PineconeConfiguration;

  constructor(config: PineconeConfiguration) {
    this._config = config;
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Lists all indexes in the project. The returned list includes `schema`
   * fields describing the typed fields of each index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexList = await pc.indexes.list();
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
   */
  async list(): Promise<IndexList> {
    const indexList = await listIndexes(this._api);
    if (indexList.indexes && indexList.indexes.length > 0) {
      for (const index of indexList.indexes) {
        const host = index.privateHost || index.host;
        IndexHostSingleton._set(this._config, index.name, host);
      }
    }
    return indexList;
  }

  /**
   * Creates a schema-based index.
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
   * const indexModel = await pc.indexes.create({
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
   * @param options - The {@link CreateIndexOptions} for creating the index, including `name`, `schema`, and optional `waitUntilReady` and `timeout`.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters or project quotas.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in the project.
   * @returns A promise that resolves to {@link IndexModel} when the creation request is accepted. Use `waitUntilReady: true` to block until the index is ready for data operations.
   */
  async create(options: CreateIndexOptions): Promise<IndexModel | void> {
    const indexModel = await createIndex(this._api, options);
    // `createIndex` resolves to `void` when `suppressConflicts` swallowed a
    // conflict, in which case there is no host to cache.
    if (!indexModel) {
      return;
    }
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexModel.name, host);
    return indexModel;
  }

  /**
   * Creates an index with an integrated embedding model.
   *
   * A convenience wrapper around {@link create}: the server builds a
   * `semantic_text` schema field named `field` from the model parameters you
   * provide. For full control over schema composition — for example combining
   * semantic text with additional metadata fields — use {@link create} directly.
   *
   * Integrated-embedding indexes are serverless only; omit `deployment` to
   * default to managed (serverless) on AWS `us-east-1`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.indexes.createForModel({
   *   name: 'my-model-index',
   *   field: 'chunk_text',
   *   model: 'multilingual-e5-large',
   *   waitUntilReady: true,
   * });
   * console.log(indexModel.name);
   * // 'my-model-index'
   * ```
   *
   * @param options - The {@link CreateIndexForModelOptions} for the index, including `name`, `field`, and `model`.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters or project quotas.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in the project.
   * @returns A promise that resolves to {@link IndexModel} when the creation request is accepted.
   */
  async createForModel(
    options: CreateIndexForModelOptions,
  ): Promise<IndexModel | void> {
    const indexModel = await createIndexForModel(this._api, options);
    if (!indexModel) {
      return;
    }
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexModel.name, host);
    return indexModel;
  }

  /**
   * Describes an index by name, returning its configuration, schema, and status.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.indexes.describe('my-schema-index');
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
   */
  async describe(indexName: string): Promise<IndexModel> {
    const indexModel = await describeIndex(this._api, indexName);
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexName, host);
    return indexModel;
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
   * await pc.indexes.delete('my-schema-index');
   * ```
   *
   * @param name - The name of the index to delete.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is accepted.
   */
  async delete(name: string): Promise<void> {
    await deleteIndex(this._api, name);
    IndexHostSingleton._delete(this._config, name);
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
   * const indexModel = await pc.indexes.configure('my-schema-index', {
   *   deletion_protection: 'enabled',
   *   tags: { team: 'ml-platform' },
   * });
   * console.log(indexModel.name);
   * // 'my-schema-index'
   * ```
   *
   * @param name - The name of the index to configure.
   * @param options - The {@link ConfigureIndexOptions} fields to update. Only provided fields are changed.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to the updated {@link IndexModel}.
   */
  async configure(
    name: string,
    options: ConfigureIndexOptions,
  ): Promise<IndexModel> {
    return configureIndex(this._api, name, options);
  }

  /**
   * Creates a backup of an index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const backup = await pc.indexes.createBackup('my-schema-index', {
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
  async createBackup(
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
   * const backupList = await pc.indexes.listBackups('my-schema-index', { limit: 10 });
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
  async listBackups(
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
   * const backupList = await pc.indexes.listProjectBackups({ limit: 5 });
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
  async listProjectBackups(
    options?: ListProjectBackupsOptions,
  ): Promise<BackupList> {
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
   * const backup = await pc.indexes.describeBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
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
  async describeBackup(backupId: string): Promise<BackupModel> {
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
   * await pc.indexes.deleteBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
   * ```
   *
   * @param backupId - The ID of the backup to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is accepted.
   * @see [Backups](https://docs.pinecone.io/guides/indexes/backups)
   */
  async deleteBackup(backupId: string): Promise<void> {
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
   * const response = await pc.indexes.createFromBackup(
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
  async createFromBackup(
    backupId: string,
    options: CreateIndexFromBackupOptions,
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
   * const restoreJobs = await pc.indexes.listRestoreJobs({ limit: 3 });
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
  async listRestoreJobs(
    options?: ListRestoreJobsOptions,
  ): Promise<RestoreJobList> {
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
   * const job = await pc.indexes.describeRestoreJob('4d4c8693-10fd-4204-a57b-1e3e626fca07');
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
  async describeRestoreJob(jobId: string): Promise<RestoreJobModel> {
    return describeRestoreJob(this._api, jobId);
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
   * const collectionList = await pc.indexes.listCollections();
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
   */
  async listCollections(): Promise<CollectionList> {
    return listCollections(this._api);
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
   * const collection = await pc.indexes.createCollection({
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
   * @param options - The {@link CreateCollectionOptions} for the collection, including `name` and `source` index name.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionModel}.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   */
  async createCollection(
    options: CreateCollectionOptions,
  ): Promise<CollectionModel> {
    return createCollection(this._api, options);
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
   * const collection = await pc.indexes.describeCollection('my-collection');
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
   */
  async describeCollection(collectionName: string): Promise<CollectionModel> {
    return describeCollection(this._api, collectionName);
  }

  /**
   * Deletes an existing collection by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.indexes.deleteCollection('my-collection');
   * ```
   *
   * @param collectionName - The name of the collection to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is completed.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   */
  async deleteCollection(collectionName: string): Promise<void> {
    return deleteCollection(this._api, collectionName);
  }
}
