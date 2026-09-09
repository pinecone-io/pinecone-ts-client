import type {
  CreateIndexOptions,
  IndexModel,
  CreateIndexForModelOptions,
  ConfigureIndexOptions,
  CreateCollectionOptions,
  CreateBackupOptions,
  CreateIndexFromBackupOptions,
  ListIndexBackupsOptions,
  ListRestoreJobsOptions,
} from './control';
import type {
  CreateAssistantOptions,
  UpdateAssistantOptions,
  EvaluateOptions,
} from './assistant/control';
import { Indexes } from './control/indexes';
import { Collections } from './control/collections';
import { Backups } from './control/backups';
import { RestoreJobs } from './control/restoreJobs';
import { BackupSchedules } from './control/backupSchedules';
import { Assistants } from './assistant/control/assistants';
import type { HTTPHeaders } from './pinecone-generated-ts-fetch/db_data';
import {
  PineconeConfigurationError,
  PineconeEnvironmentVarsNotSupportedError,
} from './errors';
import { Index } from './data';
import type { PineconeConfiguration, RecordMetadata } from './data';
import { Inference } from './inference';
import { isBrowser } from './utils/environment';
import { Assistant } from './assistant';
import { IndexOptions, AssistantOptions } from './types';

/**
 * A client for managing Pinecone resources and working with indexed data.
 * Create a client with your project API key, or set `PINECONE_API_KEY` and call `new Pinecone()`.
 * Use {@link Pinecone.index | index} for data operations and {@link Pinecone.indexes | indexes}
 * to create and manage indexes.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
 * ```
 *
 * @see {@link PineconeConfiguration} for authentication and request settings.
 * @see {@link AdminClient} for organization administration using a service account.
 */
export class Pinecone {
  /** Generate embeddings, rerank documents, and discover inference models. */
  public inference: Inference;
  /**
   * Create, configure, and manage indexes.
   *
   * @example
   * ```typescript
   * const list = await pc.indexes.list();
   * const indexModel = await pc.indexes.describe('product-catalog');
   * ```
   */
  public indexes: Indexes;
  /**
   * Create and manage collections of pod-based index data.
   *
   * @example
   * ```typescript
   * const collections = await pc.collections.list();
   * ```
   */
  public collections: Collections;
  /**
   * Create and restore index backups.
   *
   * @example
   * ```typescript
   * const backups = await pc.backups.list();
   * ```
   */
  public backups: Backups;
  /**
   * Inspect the progress of index restores.
   *
   * @example
   * ```typescript
   * const jobs = await pc.restoreJobs.list();
   * ```
   */
  public restoreJobs: RestoreJobs;
  /**
   * Manage recurring index backups.
   *
   * @example
   * ```typescript
   * const schedules = await pc.backupSchedules.list('product-catalog');
   * ```
   */
  public backupSchedules: BackupSchedules;
  /**
   * Create and manage assistants.
   *
   * @example
   * ```typescript
   * const assistants = await pc.assistants.list();
   * ```
   */
  public assistants: Assistants;

  /**
   * Create a client authenticated with a project API key.
   *
   * @param options - Client configuration. Omit to read `PINECONE_API_KEY` and the optional
   * `PINECONE_CONTROLLER_HOST` from the environment. An explicit configuration must include `apiKey`.
   * @throws {@link Errors.PineconeConfigurationError} if the API key is missing.
   * @throws {@link Errors.PineconeEnvironmentVarsNotSupportedError} if options are omitted
   * and the runtime cannot read environment variables; pass an explicit configuration instead.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
   * ```
   */
  constructor(options?: PineconeConfiguration) {
    if (options === undefined) {
      options = this._readEnvironmentConfig();
    }

    if (!options.apiKey) {
      throw new PineconeConfigurationError(
        'The client configuration must have required property: apiKey.',
      );
    }

    this.config = options;

    this._checkForBrowser();

    // Control-plane operations, grouped by resource
    this.indexes = new Indexes(this.config);
    this.collections = new Collections(this.config);
    this.backups = new Backups(this.config);
    this.restoreJobs = new RestoreJobs(this.config);
    this.backupSchedules = new BackupSchedules(this.config);
    this.assistants = new Assistants(this.config);

    // Assistant operations

    // Inference operations
    this.inference = new Inference(this.config);
  }

  /**
   * @internal
   * This method is used by {@link Pinecone.constructor} to read configuration from environment variables.
   *
   * It looks for the following environment variables:
   * - `PINECONE_API_KEY`
   * - `PINECONE_CONTROLLER_HOST`
   *
   * @returns A {@link PineconeConfiguration} object populated with values found in environment variables.
   */
  _readEnvironmentConfig(): PineconeConfiguration {
    if (typeof process === 'undefined' || !process || !process.env) {
      throw new PineconeEnvironmentVarsNotSupportedError(
        'Your execution environment does not support reading environment variables from process.env, so a' +
          ' configuration object is required when calling new Pinecone().',
      );
    }

    const environmentConfig = {};
    const requiredEnvVarMap = {
      apiKey: 'PINECONE_API_KEY',
    };
    const missingVars: Array<string> = [];
    for (const [key, envVar] of Object.entries(requiredEnvVarMap)) {
      const value = process.env[envVar] || '';
      if (!value) {
        missingVars.push(envVar);
      }
      environmentConfig[key] = value;
    }
    if (missingVars.length > 0) {
      throw new PineconeConfigurationError(
        `Since you called 'new Pinecone()' with no configuration object, we attempted to find client configuration in environment variables but the required environment variables were not set. Missing variables: ${missingVars.join(
          ', ',
        )}.`,
      );
    }

    const optionalEnvVarMap = {
      controllerHostUrl: 'PINECONE_CONTROLLER_HOST',
    };
    for (const [key, envVar] of Object.entries(optionalEnvVarMap)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        environmentConfig[key] = value;
      }
    }

    return environmentConfig as PineconeConfiguration;
  }

  /**
   * {@inheritDoc Indexes.create}
   *
   * @throws {@link Errors.PineconeArgumentError} when the index name or schema is missing.
   *
   * @throws {@link Errors.PineconeConflictError} when an index with this name already exists.
   *
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.create({
   *   name: 'product-catalog',
   *   schema: { fields: { description: { type: 'string', fullTextSearch: {} } } },
   *   waitUntilReady: true,
   * });
   * console.log(index.name);
   * ```
   *
   * @see {@link Indexes.createForModel} to embed document text with an integrated model.
   *
   * @deprecated Use {@link Indexes.create} instead.
   */
  createIndex(
    options: CreateIndexOptions & { suppressConflicts?: false },
  ): Promise<IndexModel>;
  /**
   * {@inheritDoc Indexes.create}
   *
   * @throws {@link Errors.PineconeArgumentError} when the index name or schema is missing.
   *
   * @throws {@link Errors.PineconeConflictError} when an index with this name already exists.
   *
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.create({
   *   name: 'product-catalog',
   *   schema: { fields: { description: { type: 'string', fullTextSearch: {} } } },
   *   waitUntilReady: true,
   * });
   * console.log(index.name);
   * ```
   *
   * @see {@link Indexes.createForModel} to embed document text with an integrated model.
   *
   * @deprecated Use {@link Indexes.create} instead.
   */
  createIndex(options: CreateIndexOptions): Promise<IndexModel | void>;
  createIndex(options: CreateIndexOptions) {
    return this.indexes.create(options);
  }

  /**
   * {@inheritDoc Indexes.createForModel}
   *
   * @throws {@link Errors.PineconeArgumentError} when required index or embedding settings are missing or the metric is invalid.
   *
   * @throws {@link Errors.PineconeConflictError} when an index with this name already exists.
   *
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.createForModel({
   *   name: 'product-catalog',
   *   cloud: 'aws',
   *   region: 'us-east-1',
   *   embed: {
   *     model: 'multilingual-e5-large',
   *     fieldMap: { text: 'description' },
   *   },
   *   waitUntilReady: true,
   * });
   * console.log(index.name);
   * ```
   *
   * @see {@link Indexes.create} to define vector or full-text search fields yourself.
   *
   * @deprecated Use {@link Indexes.createForModel} instead.
   */
  createIndexForModel(
    options: CreateIndexForModelOptions & { suppressConflicts?: false },
  ): Promise<IndexModel>;
  /**
   * {@inheritDoc Indexes.createForModel}
   *
   * @throws {@link Errors.PineconeArgumentError} when required index or embedding settings are missing or the metric is invalid.
   *
   * @throws {@link Errors.PineconeConflictError} when an index with this name already exists.
   *
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.createForModel({
   *   name: 'product-catalog',
   *   cloud: 'aws',
   *   region: 'us-east-1',
   *   embed: {
   *     model: 'multilingual-e5-large',
   *     fieldMap: { text: 'description' },
   *   },
   *   waitUntilReady: true,
   * });
   * console.log(index.name);
   * ```
   *
   * @see {@link Indexes.create} to define vector or full-text search fields yourself.
   *
   * @deprecated Use {@link Indexes.createForModel} instead.
   */
  createIndexForModel(
    options: CreateIndexForModelOptions,
  ): Promise<IndexModel | void>;
  createIndexForModel(options: CreateIndexForModelOptions) {
    return this.indexes.createForModel(options);
  }

  /**
   * {@inheritDoc Indexes.describe}
   *
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.describe('product-catalog');
   * console.log(index.status.ready);
   * ```
   *
   * @deprecated Use {@link Indexes.describe} instead.
   */
  describeIndex(indexName: string) {
    return this.indexes.describe(indexName);
  }

  /**
   * {@inheritDoc Indexes.list}
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const result = await pc.indexes.list();
   * console.log(result.indexes);
   * ```
   *
   * @deprecated Use {@link Indexes.list} instead.
   */
  listIndexes() {
    return this.indexes.list();
  }

  /**
   * Deletes an index and its data.
   *
   * Disable deletion protection first. The index may still be terminating when this call returns.
   *
   * @param indexName - The index name, such as `product-catalog`.
   * @returns Resolves when the deletion request is accepted.
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.indexes.delete('product-catalog');
   * ```
   *
   * @deprecated Use {@link Indexes.delete} instead.
   */
  deleteIndex(indexName: string) {
    return this.indexes.delete(indexName);
  }

  /**
   * {@inheritDoc Collections.create}
   *
   * @throws {@link Errors.PineconeArgumentError} when the collection name or source is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const collection = await pc.collections.create({
   *   name: 'catalog-snapshot',
   *   source: 'catalog-pod-index',
   * });
   * console.log(collection.status);
   * ```
   *
   * @deprecated Use {@link Collections.create} instead.
   */
  createCollection(options: CreateCollectionOptions) {
    return this.collections.create(options);
  }

  /**
   * {@inheritDoc Collections.list}
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const result = await pc.collections.list();
   * console.log(result.collections);
   * ```
   *
   * @deprecated Use {@link Collections.list} instead.
   */
  listCollections() {
    return this.collections.list();
  }

  /**
   * {@inheritDoc Collections.describe}
   *
   * @throws {@link Errors.PineconeArgumentError} when the collection name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const collection = await pc.collections.describe('catalog-snapshot');
   * console.log(collection.status);
   * ```
   *
   * @deprecated Use {@link Collections.describe} instead.
   */
  describeCollection(collectionName: string) {
    return this.collections.describe(collectionName);
  }

  /**
   * {@inheritDoc Collections.delete}
   *
   * @throws {@link Errors.PineconeArgumentError} when the collection name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.collections.delete('catalog-snapshot');
   * ```
   *
   * @deprecated Use {@link Collections.delete} instead.
   */
  deleteCollection(collectionName: string) {
    return this.collections.delete(collectionName);
  }

  /**
   * Create a backup of an index.
   *
   * @param options - Source `indexName` and optional backup name and description.
   * @returns The backup details and creation status.
   *
   * @example
   * ```typescript
   * const backup = await pc.backups.create('product-catalog', { name: 'before-reimport' });
   * ```
   *
   * @deprecated Use {@link Backups.create} with the index name as its first argument.
   */
  createBackup(options: CreateBackupOptions & { indexName: string }) {
    const { indexName, ...rest } = options;
    return this.backups.create(indexName, rest);
  }

  /**
   * {@inheritDoc Backups.describe}
   *
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
   *
   * @deprecated Use {@link Backups.describe} instead.
   */
  describeBackup(backupId: string) {
    return this.backups.describe(backupId);
  }

  /**
   * {@inheritDoc Backups.delete}
   *
   * @throws {@link Errors.PineconeArgumentError} when the backup ID is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.backups.delete('11450b9f-96e5-47e5-9186-03f346b1f385');
   * ```
   *
   * @deprecated Use {@link Backups.delete} instead.
   */
  deleteBackup(backupId: string) {
    return this.backups.delete(backupId);
  }

  /**
   * Start restoring a backup into a new index.
   *
   * @param options - Source `backupId`, destination index name, and optional index settings.
   * @returns The restore job ID and destination index details.
   *
   * @example
   * ```typescript
   * const restore = await pc.backups.createIndex('backup-7f3a', { name: 'catalog-restored' });
   * ```
   *
   * @deprecated Use {@link Backups.createIndex} with the backup ID as its first argument.
   */
  createIndexFromBackup(
    options: CreateIndexFromBackupOptions & { backupId: string },
  ) {
    const { backupId, ...rest } = options;
    return this.backups.createIndex(backupId, rest);
  }

  /**
   * Retrieves the current progress of a restore job.
   *
   * @param restoreJobId - The `restoreJobId` returned by {@link Backups.createIndex}.
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
   *
   * @deprecated Use {@link RestoreJobs.describe} instead.
   */
  describeRestoreJob(restoreJobId: string) {
    return this.restoreJobs.describe(restoreJobId);
  }

  /**
   * {@inheritDoc RestoreJobs.list}
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const page = await pc.restoreJobs.list({ limit: 10 });
   * console.log(page.data, page.pagination?.next);
   * ```
   *
   * @deprecated Use {@link RestoreJobs.list} instead.
   */
  listRestoreJobs(options?: ListRestoreJobsOptions) {
    return this.restoreJobs.list(options);
  }

  /**
   * {@inheritDoc Assistants.create}
   *
   * @throws {@link Errors.PineconeArgumentError} if options are missing or the region is unsupported.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = await pc.assistants.create({ name: 'support-guide' });
   * console.log(assistant.status);
   * ```
   *
   * @deprecated Use {@link Assistants.create} instead.
   */
  createAssistant(options: CreateAssistantOptions) {
    return this.assistants.create(options);
  }

  /**
   * {@inheritDoc Assistants.describe}
   *
   * @throws {@link Errors.PineconeArgumentError} if `assistantName` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = await pc.assistants.describe('support-guide');
   * console.log(assistant.status);
   * ```
   *
   * @see {@link Assistants.list} to discover assistants.
   *
   * @deprecated Use {@link Assistants.describe} instead.
   */
  describeAssistant(assistantName: string) {
    return this.assistants.describe(assistantName);
  }

  /**
   * {@inheritDoc Assistants.list}
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.assistants.list();
   * console.log(result.assistants);
   * ```
   *
   * @see {@link Assistants.describe} for details of one assistant.
   *
   * @deprecated Use {@link Assistants.list} instead.
   */
  listAssistants() {
    return this.assistants.list();
  }

  /**
   * {@inheritDoc Assistants.delete}
   *
   * @throws {@link Errors.PineconeArgumentError} if `assistantName` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistants.delete('support-guide');
   * ```
   *
   * @deprecated Use {@link Assistants.delete} instead.
   */
  deleteAssistant(assistantName: string) {
    return this.assistants.delete(assistantName);
  }

  /**
   * {@inheritDoc Assistants.update}
   *
   * @throws {@link Errors.PineconeArgumentError} if options or the assistant name are missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.assistants.update({
   *   name: 'support-guide',
   *   instructions: 'Answer using the uploaded support policies and cite your sources.',
   * });
   * console.log(result.instructions);
   * ```
   *
   * @deprecated Use {@link Assistants.update} instead.
   */
  updateAssistant(options: UpdateAssistantOptions) {
    return this.assistants.update(options);
  }

  /**
   * {@inheritDoc Assistants.evaluate}
   *
   * @throws {@link Errors.PineconeArgumentError} if options are missing or an answer or question is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.assistants.evaluate({
   *   question: 'Where can I start a return?',
   *   answer: 'Start a return from your order history.',
   *   groundTruth: 'Customers can start returns from their order history.',
   * });
   * console.log(result.metrics);
   * ```
   *
   * @deprecated Use {@link Assistants.evaluate} instead.
   */
  evaluate(options: EvaluateOptions) {
    return this.assistants.evaluate(options);
  }

  /**
   * Update an index configuration.
   *
   * @param options - Index `name` and the settings to change; omitted settings are unchanged.
   * @returns The updated index details.
   *
   * @example
   * ```typescript
   * await pc.indexes.configure('product-catalog', { deletionProtection: 'enabled' });
   * ```
   *
   * @deprecated Use {@link Indexes.configure} with the index name as its first argument.
   */
  configureIndex(options: ConfigureIndexOptions & { name: string }) {
    const { name, ...rest } = options;
    return this.indexes.configure(name, rest);
  }

  /**
   * List one page of backups for an index or the project.
   *
   * @param options - Pagination settings and optional `indexName`. Omit to list project backups.
   * `includeDeleted` applies only when `indexName` is supplied.
   * @returns Backups and a pagination token for the next page, when present.
   *
   * @example
   * ```typescript
   * const page = await pc.backups.listByIndex('product-catalog');
   * console.log(page.data);
   * ```
   *
   * @deprecated Use {@link Backups.listByIndex} for one index or {@link Backups.list} for the project.
   */
  listBackups(
    options: ListIndexBackupsOptions & {
      indexName?: string;
    } = {},
  ) {
    const { indexName, includeDeleted, ...rest } = options;
    if (indexName) {
      return this.backups.listByIndex(indexName, { ...rest, includeDeleted });
    }
    return this.backups.list(rest);
  }

  /** @hidden */
  private config: PineconeConfiguration;

  /** @internal */
  _checkForBrowser() {
    if (isBrowser()) {
      console.warn(
        'The Pinecone SDK is intended for server-side use only. Using the SDK within a browser context can expose your API key(s). If you have deployed the SDK to production in a browser, please rotate your API keys.',
      );
    }
  }

  /**
   * Return the configuration used by this client.
   *
   * @returns The configuration object, including the API key. Treat it as sensitive.
   *
   * @example
   * ```typescript
   * const config = pc.getConfig();
   * console.log(config.maxRetries);
   * ```
   */
  getConfig() {
    return this.config;
  }

  /**
   * Target an index for data operations.
   *
   * Supplying a host avoids the index-name lookup. A name alone is resolved when needed.
   *
   * @typeParam T - Metadata fields associated with vector records.
   * @param options - Index name or host, and optionally a namespace and additional request headers.
   * @returns An {@link Index} scoped to the selected index and namespace.
   *
   * @example
   * ```typescript
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   * ```
   *
   * @example
   * ```typescript
   * type ProductMetadata = { title: string; category: string };
   * const model = await pc.indexes.describe('product-catalog');
   * const index = pc.index<ProductMetadata>({ host: model.host });
   * const result = await index.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.records['trail-shoe-42']?.metadata?.title);
   * ```
   *
   * @see {@link Pinecone.indexes} to create or configure an index.
   */
  index<T extends RecordMetadata = RecordMetadata>(
    options: IndexOptions,
  ): Index<T>;
  /**
   * Target an index using positional arguments.
   *
   * @typeParam T - Metadata fields associated with vector records.
   * @param indexName - Index name, such as `product-catalog`.
   * @param indexHostUrl - Index host; omit to resolve it from the name.
   * @param additionalHeaders - Additional headers to include in index requests.
   * @returns An index client using the default namespace.
   *
   * @example
   * ```typescript
   * const index = pc.index({ name: 'product-catalog' });
   * ```
   *
   * @deprecated Use the options overload of {@link Pinecone.index} instead.
   */
  index<T extends RecordMetadata = RecordMetadata>(
    indexName: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T>;
  index<T extends RecordMetadata = RecordMetadata>(
    optionsOrName: IndexOptions | string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T> {
    // Handle legacy string-based API
    if (typeof optionsOrName === 'string') {
      return new Index<T>(
        {
          name: optionsOrName,
          host: indexHostUrl,
          additionalHeaders: additionalHeaders,
        },
        this.config,
      );
    }

    // Handle new options-based API
    return new Index<T>(
      {
        name: optionsOrName.name,
        namespace: optionsOrName.namespace,
        host: optionsOrName.host,
        additionalHeaders: optionsOrName.additionalHeaders,
      },
      this.config,
    );
  }

  /**
   * {@inheritDoc index}
   *
   * @example
   * ```typescript
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   * ```
   *
   * @example
   * ```typescript
   * type ProductMetadata = { title: string; category: string };
   * const model = await pc.indexes.describe('product-catalog');
   * const index = pc.index<ProductMetadata>({ host: model.host });
   * const result = await index.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.records['trail-shoe-42']?.metadata?.title);
   * ```
   *
   * @see {@link Pinecone.indexes} to create or configure an index.
   */
  // Alias method to match the Python SDK capitalization
  Index<T extends RecordMetadata = RecordMetadata>(
    options: IndexOptions,
  ): Index<T>;
  /**
   * Target an index using positional arguments.
   *
   * @typeParam T - Metadata fields associated with vector records.
   * @param indexName - Index name, such as `product-catalog`.
   * @param indexHostUrl - Index host; omit to resolve it from the name.
   * @param additionalHeaders - Additional headers to include in index requests.
   * @returns An index client using the default namespace.
   *
   * @example
   * ```typescript
   * const index = pc.index({ name: 'product-catalog' });
   * ```
   *
   * @deprecated Use the options overload of {@link Pinecone.index} instead.
   */
  Index<T extends RecordMetadata = RecordMetadata>(
    indexName: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T>;
  Index<T extends RecordMetadata = RecordMetadata>(
    optionsOrName: IndexOptions | string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T> {
    return this.index<T>(optionsOrName as any, indexHostUrl, additionalHeaders);
  }

  /**
   * Target an assistant for file uploads, context retrieval, and chat.
   *
   * @param options - Assistant name, with an optional host and additional request headers.
   * @returns An {@link Assistant} scoped to the selected assistant.
   *
   * @example
   * ```typescript
   * const assistant = pc.assistant({ name: 'support-handbook' });
   * const response = await assistant.chat({
   *   messages: [{ role: 'user', content: 'How do I return a damaged order?' }],
   * });
   * console.log(response.message?.content);
   * ```
   *
   * @see {@link Pinecone.assistants} to create an assistant or update its instructions.
   */
  assistant(options: AssistantOptions): Assistant;
  /**
   * Target an assistant using positional arguments.
   *
   * @param name - Assistant name, such as `support-handbook`.
   * @param host - Assistant host; omit to resolve it from the name.
   * @returns An assistant client.
   *
   * @example
   * ```typescript
   * const assistant = pc.assistant({ name: 'support-handbook' });
   * ```
   *
   * @deprecated Use the options overload of {@link Pinecone.assistant} instead.
   */
  assistant(name: string, host?: string): Assistant;
  assistant(
    optionsOrName: AssistantOptions | string,
    host?: string,
  ): Assistant {
    // Handle legacy string-based API
    if (typeof optionsOrName === 'string') {
      return new Assistant(
        {
          name: optionsOrName,
          host: host,
        },
        this.config,
      );
    }

    // Handle new options-based API
    return new Assistant(optionsOrName, this.config);
  }

  /**
   * {@inheritDoc assistant}
   *
   * @example
   * ```typescript
   * const assistant = pc.assistant({ name: 'support-handbook' });
   * const response = await assistant.chat({
   *   messages: [{ role: 'user', content: 'How do I return a damaged order?' }],
   * });
   * console.log(response.message?.content);
   * ```
   *
   * @see {@link Pinecone.assistants} to create an assistant or update its instructions.
   */
  // Alias method
  Assistant(options: AssistantOptions): Assistant;
  /**
   * Target an assistant using positional arguments.
   *
   * @param name - Assistant name, such as `support-handbook`.
   * @param host - Assistant host; omit to resolve it from the name.
   * @returns An assistant client.
   *
   * @example
   * ```typescript
   * const assistant = pc.assistant({ name: 'support-handbook' });
   * ```
   *
   * @deprecated Use the options overload of {@link Pinecone.assistant} instead.
   */
  Assistant(name: string, host?: string): Assistant;
  Assistant(
    optionsOrName: AssistantOptions | string,
    host?: string,
  ): Assistant {
    return this.assistant(optionsOrName as any, host);
  }
}
