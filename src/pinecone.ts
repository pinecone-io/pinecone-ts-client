import {
  configureIndex,
  createBackup,
  createCollection,
  createIndex,
  createIndexForModel,
  createIndexFromBackup,
  deleteBackup,
  deleteCollection,
  deleteIndex,
  describeBackup,
  describeCollection,
  describeIndex,
  describeRestoreJob,
  indexOperationsBuilder,
  listBackups,
  listCollections,
  listIndexes,
  listRestoreJobs,
  CollectionName,
  CreateBackupOptions,
  CreateIndexFromBackupOptions,
  DeleteBackupOptions,
  DescribeBackupOptions,
  ListBackupsOptions,
  ListRestoreJobsOptions,
  CreateIndexForModelOptions,
  CreateIndexOptions,
  IndexName,
  DescribeRestoreJobOptions,
} from './control';
import {
  createAssistant,
  CreateAssistantOptions,
  deleteAssistant,
  describeAssistant,
  updateAssistant,
  UpdateAssistantOptions,
  listAssistants,
} from './assistant/control';
import { AssistantHostSingleton } from './assistant/assistantHostSingleton';
import type { CreateCollectionRequest } from './pinecone-generated-ts-fetch/db_control';
import type { HTTPHeaders } from './pinecone-generated-ts-fetch/db_data';
import { IndexHostSingleton } from './data/indexHostSingleton';
import {
  PineconeConfigurationError,
  PineconeEnvironmentVarsNotSupportedError,
} from './errors';
import { Index } from './data';
import type { PineconeConfiguration, RecordMetadata } from './data';
import { Inference } from './inference';
import { isBrowser } from './utils/environment';
import { asstControlOperationsBuilder } from './assistant/control/asstControlOperationsBuilder';
import { Assistant } from './assistant';
import { ConfigureIndexOptions } from './control/configureIndex';
import { IndexOptions, AssistantOptions } from './types';

/**
 * The `Pinecone` class is the main entrypoint to this sdk. You will use
 * instances of it to create and manage indexes as well as perform data
 * operations on those indexes after they are created.
 *
 * ### Initializing the client
 *
 * There is one piece of configuration required to use the Pinecone client: an API key. This value can be passed using environment variables or in code through a configuration object. Find your API key in the console dashboard at [https://app.pinecone.io](https://app.pinecone.io)
 *
 * ### Using environment variables
 *
 * The environment variables used to configure the client are the following:
 *
 * ```bash
 * export PINECONE_API_KEY="your_api_key"
 * export PINECONE_CONTROLLER_HOST="your_controller_host"
 * ```
 *
 * When these environment variables are set, the client constructor does not require any additional arguments.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * ```
 *
 * ### Using a configuration object
 *
 * If you prefer to pass configuration in code, the constructor accepts a config object containing the `apiKey` and `environment` values. This
 * could be useful if your application needs to interact with multiple projects, each with a different configuration.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone({
 *   apiKey: 'your_api_key',
 * });
 *
 * ```
 *
 * See {@link PineconeConfiguration} for a full description of available configuration options.
 */
export class Pinecone {
  /** @hidden */
  private _configureIndex: ReturnType<typeof configureIndex>;
  /** @hidden */
  private _createCollection: ReturnType<typeof createCollection>;
  /** @hidden */
  private _createIndex: ReturnType<typeof createIndex>;
  /** @hidden */
  private _createIndexForModel: ReturnType<typeof createIndexForModel>;
  /** @hidden */
  private _describeCollection: ReturnType<typeof describeCollection>;
  /** @hidden */
  private _describeIndex: ReturnType<typeof describeIndex>;
  /** @hidden */
  private _deleteCollection: ReturnType<typeof deleteCollection>;
  /** @hidden */
  private _deleteIndex: ReturnType<typeof deleteIndex>;
  /** @hidden */
  private _listCollections: ReturnType<typeof listCollections>;
  /** @hidden */
  private _listIndexes: ReturnType<typeof listIndexes>;
  /** @hidden */
  private _createAssistant: ReturnType<typeof createAssistant>;
  /** @hidden */
  private _deleteAssistant: ReturnType<typeof deleteAssistant>;
  /** @hidden */
  private _updateAssistant: ReturnType<typeof updateAssistant>;
  /** @hidden */
  private _describeAssistant: ReturnType<typeof describeAssistant>;
  /** @hidden */
  private _listAssistants: ReturnType<typeof listAssistants>;
  /** @hidden */
  private _createBackup: ReturnType<typeof createBackup>;
  /** @hidden */
  private _createIndexFromBackup: ReturnType<typeof createIndexFromBackup>;
  /** @hidden */
  private _describeBackup: ReturnType<typeof describeBackup>;
  /** @hidden */
  private _describeRestoreJob: ReturnType<typeof describeRestoreJob>;
  /** @hidden */
  private _deleteBackup: ReturnType<typeof deleteBackup>;
  /** @hidden */
  private _listBackups: ReturnType<typeof listBackups>;
  /** @hidden */
  private _listRestoreJobs: ReturnType<typeof listRestoreJobs>;

  public inference: Inference;

  /**
   * @example
   * ```
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone({
   *  apiKey: 'my-api-key',
   * });
   * ```
   *
   * @constructor
   * @param options - The configuration options for the Pinecone client: {@link PineconeConfiguration}.
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

    const api = indexOperationsBuilder(this.config);
    const asstControlApi = asstControlOperationsBuilder(this.config);

    this._configureIndex = configureIndex(api);
    this._createCollection = createCollection(api);
    this._createIndex = createIndex(api);
    this._createIndexForModel = createIndexForModel(api);
    this._describeCollection = describeCollection(api);
    this._deleteCollection = deleteCollection(api);
    this._describeIndex = describeIndex(api);
    this._deleteIndex = deleteIndex(api);
    this._listCollections = listCollections(api);
    this._listIndexes = listIndexes(api);

    this._createAssistant = createAssistant(asstControlApi);
    this._deleteAssistant = deleteAssistant(asstControlApi);
    this._updateAssistant = updateAssistant(asstControlApi);
    this._describeAssistant = describeAssistant(asstControlApi);
    this._listAssistants = listAssistants(asstControlApi);

    this._createBackup = createBackup(api);
    this._createIndexFromBackup = createIndexFromBackup(api);
    this._describeBackup = describeBackup(api);
    this._describeRestoreJob = describeRestoreJob(api);
    this._deleteBackup = deleteBackup(api);
    this._listBackups = listBackups(api);
    this._listRestoreJobs = listRestoreJobs(api);

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

  /** @hidden */
  private config: PineconeConfiguration;

  /**
   * Describe a Pinecone index
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.describeIndex('my-index')
   * console.log(indexModel)
   * // {
   * //     name: 'sample-index-1',
   * //     dimension: 3,
   * //     metric: 'cosine',
   * //     host: 'sample-index-1-1390950.svc.apw5-4e34-81fa.pinecone.io',
   * //     spec: {
   * //           pod: undefined,
   * //           serverless: {
   * //               cloud: 'aws',
   * //               region: 'us-west-2'
   * //           }
   * //     },
   * //     status: {
   * //           ready: true,
   * //           state: 'Ready'
   * //     }
   * // }
   * ```
   *
   * @param indexName - The name of the index to describe.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexModel}.
   */
  async describeIndex(indexName: IndexName) {
    const indexModel = await this._describeIndex(indexName);

    // For any describeIndex calls we want to update the IndexHostSingleton cache.
    // This prevents unneeded calls to describeIndex for resolving the host for vector operations.
    if (indexModel.host) {
      IndexHostSingleton._set(this.config, indexName, indexModel.host);
    }

    return Promise.resolve(indexModel);
  }

  /**
   * List all Pinecone indexes
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexList = await pc.listIndexes()
   * console.log(indexList)
   * // {
   * //     indexes: [
   * //       {
   * //         name: "sample-index-1",
   * //         dimension: 3,
   * //         metric: "cosine",
   * //         host: "sample-index-1-1234567.svc.apw5-2e18-32fa.pinecone.io",
   * //         spec: {
   * //           serverless: {
   * //             cloud: "aws",
   * //             region: "us-west-2"
   * //           }
   * //         },
   * //         status: {
   * //           ready: true,
   * //           state: "Ready"
   * //         }
   * //       },
   * //       {
   * //         name: "sample-index-2",
   * //         dimension: 3,
   * //         metric: "cosine",
   * //         host: "sample-index-2-1234567.svc.apw2-5e76-83fa.pinecone.io",
   * //         spec: {
   * //           serverless: {
   * //             cloud: "aws",
   * //             region: "us-west-2"
   * //           }
   * //         },
   * //         status: {
   * //           ready: true,
   * //           state: "Ready"
   * //         }
   * //       }
   * //     ]
   * //   }
   * ```
   *
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexList}.
   */
  async listIndexes() {
    const indexList = await this._listIndexes();

    // For any listIndexes calls we want to update the IndexHostSingleton cache.
    // This prevents unneeded calls to describeIndex for resolving the host for index operations.
    if (indexList.indexes && indexList.indexes.length > 0) {
      for (let i = 0; i < indexList.indexes.length; i++) {
        const index = indexList.indexes[i];
        IndexHostSingleton._set(this.config, index.name, index.host);
      }
    }

    return Promise.resolve(indexList);
  }

  /**
   * Creates a new index.
   *
   * @example
   * The minimum required configuration to create an index is the index `name`, `dimension`, and `spec`.
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   *
   * await pc.createIndex({ name: 'my-index', dimension: 128, spec: { serverless: { cloud: 'aws', region: 'us-west-2' }}})
   * ```
   *
   * @example
   * The `spec` object defines how the index should be deployed. For serverless indexes, you define only the cloud and region where the index should be hosted.
   * For pod-based indexes, you define the environment where the index should be hosted, the pod type and size to use, and other index characteristics.
   * In a different example, you can create a pod-based index by specifying the `pod` spec object with the `environment`, `pods`, `podType`, and `metric` properties.
   * For more information on creating indexes, see [Understanding indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes).
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.createIndex({
   *  name: 'my-index',
   *  dimension: 1536,
   *  metric: 'cosine',
   *  spec: {
   *    pod: {
   *      environment: 'us-west-2-gcp',
   *      pods: 1,
   *      podType: 'p1.x1'
   *    }
   *   },
   *  tags: { 'team': 'data-science' }
   * })
   * ```
   *
   * @example
   * If you would like to create the index only if it does not already exist, you can use the `suppressConflicts` boolean option.
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.createIndex({
   *   name: 'my-index',
   *   dimension: 1536,
   *   spec: {
   *     serverless: {
   *       cloud: 'aws',
   *       region: 'us-west-2'
   *     }
   *   },
   *   suppressConflicts: true,
   *   tags: { 'team': 'data-science' }
   * })
   * ```
   *
   * @example
   * If you plan to begin upserting immediately after index creation is complete, you should use the `waitUntilReady` option. Otherwise, the index may not be ready to receive data operations when you attempt to upsert.
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.createIndex({
   *  name: 'my-index',
   *   spec: {
   *     serverless: {
   *       cloud: 'aws',
   *       region: 'us-west-2'
   *     }
   *   },
   *  waitUntilReady: true,
   *  tags: { 'team': 'data-science' }
   * });
   *
   * const records = [
   *   // PineconeRecord objects with your embedding values
   * ]
   * await pc.index({ name: 'my-index' }).upsert(records)
   * ```
   *
   * @example
   * By default all metadata fields are indexed when records are upserted with metadata, but if you want to improve performance you can specify the specific fields you want to index. This example is showing a few hypothetical metadata fields, but the values you'd use depend on what metadata you plan to store with records in your Pinecone index.
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.createIndex({
   *   name: 'my-index',
   *   dimension: 1536,
   *   spec: {
   *     serverless: {
   *       cloud: 'aws',
   *       region: 'us-west-2',
   *       metadataConfig: { 'indexed' : ['productName', 'productDescription'] }
   *     }
   *   },
   *  tags: { 'team': 'data-science' }
   * })
   * ```
   *
   * @param options - The {@link CreateIndexOptions} for creating the index.
   * @see [Distance metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
   * @see [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes)
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters being specified or other problem such as project quotas limiting the creation of any additional indexes.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in your project.
   * @returns A promise that resolves to {@link IndexModel} when the request to create the index is completed. Note that the index is not immediately ready to use. You can use the {@link describeIndex} function to check the status of the index.
   */
  createIndex(options: CreateIndexOptions) {
    return this._createIndex(options);
  }

  /**
   * Creates a new integrated index which allows working with integrated inference capabilities.
   * @see [Upsert and search with integrated inference](https://docs.pinecone.io/guides/inference/integrated-inference)
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.createIndexForModel({
   *   name: 'integrated-index',
   *   cloud: 'aws',
   *   region: 'us-east-1',
   *   embed: {
   *     model: 'multilingual-e5-large',
   *     fieldMap: { text: 'chunk_text' },
   *   },
   *   waitUntilReady: true,
   * });
   * ```
   *
   * @param options - The {@link CreateIndexForModelOptions} for creating the index.
   * @see [Distance metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
   * @see [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes)
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters being specified or other problem such as project quotas limiting the creation of any additional indexes.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in your project.
   * @returns A promise that resolves to {@link IndexModel} when the request to create the index is completed. Note that the index is not immediately ready to use. You can use the {@link describeIndex} function to check the status of the index.
   */
  createIndexForModel(options: CreateIndexForModelOptions) {
    return this._createIndexForModel(options);
  }

  /**
   * Deletes an index
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.deleteIndex('my-index')
   * ```
   *
   * @param indexName - The name of the index to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @returns A promise that resolves when the request to delete the index is completed.
   */
  async deleteIndex(indexName: IndexName) {
    await this._deleteIndex(indexName);

    // When an index is deleted, we need to evict the host from the IndexHostSingleton cache.
    IndexHostSingleton._delete(this.config, indexName);

    return Promise.resolve();
  }

  /**
   * Configure an index
   *
   * Use this method to update configuration on an existing index. For both pod-based and serverless indexes you can update
   * the deletionProtection status of an index and/or change any index tags. For pod-based index you can also
   * configure the number of replicas and pod type.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.configureIndex('my-index', {
   *   deletionProtection: 'enabled',
   *   spec:{ pod:{ replicas: 2, podType: 'p1.x2' }},
   * });
   * ```
   *
   * @param indexName - The name of the index to configure.
   * @param options - The configuration properties you would like to update
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexModel} when the request to configure the index is completed.
   */
  configureIndex(indexName: IndexName, options: ConfigureIndexOptions) {
    return this._configureIndex(indexName, options);
  }

  /**
   * Create a new collection from an existing index
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexList = await pc.listIndexes()
   * const indexName = indexList.indexes[0].name;
   * await pc.createCollection({
   *  name: 'my-collection',
   *  source: indexName
   * })
   * ```
   *
   * @param options - The collection configuration.
   * @param options.name - The name of the collection. Must be unique within the project and contain alphanumeric and hyphen characters. The name must start and end with alphanumeric characters.
   * @param options.source - The name of the index to use as the source for the collection.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns a promise that resolves to {@link CollectionModel} when the request to create the collection is completed.
   */
  createCollection(options: CreateCollectionRequest) {
    return this._createCollection(options);
  }

  /**
   * List all collections in a project
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.listCollections()
   * ```
   *
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link CollectionList}.
   */
  listCollections() {
    return this._listCollections();
  }

  /**
   * Delete a collection by collection name
   *
   * @example
   * ```
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collectionList = await pc.listCollections()
   * const collectionName = collectionList.collections[0].name;
   * await pc.deleteCollection(collectionName)
   * ```
   *
   * @param collectionName - The name of the collection to delete.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the request to delete the collection is completed.
   */
  deleteCollection(collectionName: CollectionName) {
    return this._deleteCollection(collectionName);
  }

  /**
   * Describe a collection
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.describeCollection('my-collection')
   * ```
   *
   * @param collectionName - The name of the collection to describe.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionModel}.
   */
  describeCollection(collectionName: CollectionName) {
    return this._describeCollection(collectionName);
  }

  /**
   * Creates a new Assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.createAssistant({name: 'test1'});
   * // {
   * //  name: 'test11',
   * //  instructions: undefined,
   * //  metadata: undefined,
   * //  status: 'Initializing',
   * //  host: 'https://prod-1-data.ke.pinecone.io',
   * //  createdAt: 2025-01-08T22:52:49.652Z,
   * //  updatedAt: 2025-01-08T22:52:49.652Z
   * // }
   * ```
   *
   * @param options - A {@link CreateAssistantOptions} object containing the `name` of the Assistant to be created.
   * Optionally, users can also specify instructions, metadata, and host region. Region must be one of "us" or "eu"
   * and determines where the Assistant will be hosted.
   * @throws Error if the Assistant API is not initialized.
   * @throws Error if an invalid region is provided.
   * @returns A Promise that resolves to an {@link Assistant} model.
   */
  async createAssistant(options: CreateAssistantOptions) {
    const assistant = await this._createAssistant(options);

    if (assistant.host) {
      AssistantHostSingleton._set(this.config, assistant.name, assistant.host);
    }

    return Promise.resolve(assistant);
  }

  /**
   * Deletes an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.deleteAssistant('test1');
   * ```
   *
   * @param assistantName - The name of the Assistant to be deleted.
   * @throws Error if the Assistant API is not initialized.
   */
  async deleteAssistant(assistantName: string) {
    await this._deleteAssistant(assistantName);
    AssistantHostSingleton._delete(this.config, assistantName);
    return Promise.resolve();
  }

  /**
   * Retrieves information about an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const test = await pc.describeAssistant('test1');
   * console.log(test);
   * // {
   * //  name: 'test1',
   * //  instructions: undefined,
   * //  metadata: undefined,
   * //  status: 'Ready',
   * //  host: 'https://prod-1-data.ke.pinecone.io',
   * //  createdAt: 2025-01-08T22:24:50.525Z,
   * //  updatedAt: 2025-01-08T22:24:52.303Z
   * // }
   * ```
   *
   * @param assistantName - The name of the Assistant to retrieve.
   * @throws Error if the Assistant API is not initialized.
   * @returns A Promise that resolves to an {@link Assistant} model.
   */
  async describeAssistant(assistantName: string) {
    const assistant = await this._describeAssistant(assistantName);

    if (assistant.host) {
      AssistantHostSingleton._set(this.config, assistantName, assistant.host);
    }

    return Promise.resolve(assistant);
  }

  /**
   * Retrieves a list of all Assistants for a given Pinecone API key.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistants = await pc.listAssistants();
   * console.log(assistants);
   * // {
   * //  assistants: [
   * //    {
   * //      name: 'test2',
   * //      instructions: 'test-instructions',
   * //      metadata: [Object],
   * //      status: 'Ready',
   * //      host: 'https://prod-1-data.ke.pinecone.io',
   * //      createdAt: 2025-01-06T19:14:18.633Z,
   * //      updatedAt: 2025-01-06T19:14:36.977Z
   * //    },
   * //  ]
   * // }
   * ```
   *
   * @throws Error if the Assistant API is not initialized.
   * @returns A Promise that resolves to an object containing an array of {@link Assistant} models.
   */
  async listAssistants() {
    const assistantList = await this._listAssistants();

    // For any listAssistants calls we want to update the AssistantHostSingleton cache.
    // This prevents unneeded calls to describeAssistant for resolving the host for assistant operations.
    if (assistantList.assistants && assistantList.assistants.length > 0) {
      for (let i = 0; i < assistantList.assistants.length; i++) {
        const assistant = assistantList.assistants[i];
        if (assistant.host) {
          AssistantHostSingleton._set(
            this.config,
            assistant.name,
            assistant.host,
          );
        }
      }
    }

    return Promise.resolve(assistantList);
  }

  /**
   * Updates an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.updateAssistant('test1', { instructions: 'some new  instructions!'});
   * // {
   * //  assistantName: test1,
   * //  instructions: 'some new instructions!',
   * //  metadata: undefined
   * // }
   * ```
   *
   * @param assistantName - The name of the assistant being updated.
   * @param options - An {@link UpdateAssistantOptions} object containing the name of the assistant to be updated and
   * optional instructions and metadata.
   * @throws Error if the Assistant API is not initialized.
   * @returns A Promise that resolves to an {@link UpdateAssistant200Response} object.
   */
  updateAssistant(assistantName: string, options: UpdateAssistantOptions) {
    return this._updateAssistant(assistantName, options);
  }

  /** @internal */
  _checkForBrowser() {
    if (isBrowser()) {
      console.warn(
        'The Pinecone SDK is intended for server-side use only. Using the SDK within a browser context can expose your API key(s). If you have deployed the SDK to production in a browser, please rotate your API keys.',
      );
    }
  }

  /**
   * @returns The configuration object that was passed to the Pinecone constructor.
   */
  getConfig() {
    return this.config;
  }

  /**
   * Creates a backup of an index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const backup = await pc.createBackup({ indexName: 'my-index', name: 'my-index-backup-1', description: 'weekly backup' });
   * console.log(backup);
   * // {
   * //   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //   sourceIndexName: 'my-index',
   * //   sourceIndexId: 'b480770b-600d-4c4e-bf19-799c933ae2bf',
   * //   name: 'my-index-backup-1',
   * //   description: 'weekly backup',
   * //   status: 'Initializing',
   * //   cloud: 'aws',
   * //   region: 'us-east-1',
   * //   dimension: 1024,
   * //   metric: 'cosine',
   * //   recordCount: 500,
   * //   namespaceCount: 4,
   * //   sizeBytes: 78294,
   * //   tags: {},
   * //   createdAt: '2025-05-07T03:11:11.722238160Z'
   * // }
   * ```
   *
   * @param options - A {@link CreateBackupOptions} object containing the indexName to backup, and an optional name
   * and description for the backup.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to a {@link BackupModel} object.
   */
  createBackup(options: CreateBackupOptions) {
    return this._createBackup(options);
  }

  /**
   * Creates an index from an existing backup.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const response = await pc.createIndexFromBackup({ backupId: '11450b9f-96e5-47e5-9186-03f346b1f385', name: 'my-index-restore-1' });
   * console.log(response);
   * // {
   * //   restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
   * //   indexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe'
   * // }
   * ```
   *
   * @param options - A {@link CreateIndexFromBackupOptions} object containing the backupId for the backup to restore
   * the index from, and the name of the new index. Optionally, you can provide new tags or deletionProtection values for the index.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to a {@link CreateIndexFromBackupResponse} object.
   */
  createIndexFromBackup(options: CreateIndexFromBackupOptions) {
    return this._createIndexFromBackup(options);
  }

  /**
   * Describes a backup.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const backup = await pc.describeBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
   * console.log(backup);
   * // {
   * //   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //   sourceIndexName: 'my-index',
   * //   sourceIndexId: 'b480770b-600d-4c4e-bf19-799c933ae2bf',
   * //   name: 'my-index-backup-1',
   * //   description: 'weekly backup',
   * //   status: 'Initializing',
   * //   cloud: 'aws',
   * //   region: 'us-east-1',
   * //   dimension: 1024,
   * //   metric: 'cosine',
   * //   recordCount: 500,
   * //   namespaceCount: 4,
   * //   sizeBytes: 78294,
   * //   tags: {},
   * //   createdAt: '2025-05-07T03:11:11.722238160Z'
   * // }
   * ```
   *
   * @param options - The backupId of the backup to describe.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to a {@link BackupModel} object.
   */
  describeBackup(backupName: DescribeBackupOptions) {
    return this._describeBackup(backupName);
  }

  /**
   * Describes a restore job.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const restoreJob = await pc.describeRestoreJob('4d4c8693-10fd-4204-a57b-1e3e626fca07');
   * console.log(restoreJob);
   * // {
   * //   restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
   * //   backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //   targetIndexName: 'my-index-restore-1',
   * //   targetIndexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe',
   * //   status: 'Completed',
   * //   createdAt: 2025-05-07T03:38:37.107Z,
   * //   completedAt: 2025-05-07T03:40:23.687Z,
   * //   percentComplete: 100
   * // }
   * ```
   *
   * @param options - The restoreJobId of the restore job to describe.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to a {@link RestoreJobModel} object.
   */
  describeRestoreJob(restoreJobId: DescribeRestoreJobOptions) {
    return this._describeRestoreJob(restoreJobId);
  }

  /**
   * Deletes a backup.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.deleteBackup('11450b9f-96e5-47e5-9186-03f346b1f385');
   * ```
   *
   * @param options - The backupId of the backup to delete.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves when the request to delete the backup is completed.
   */
  deleteBackup(backupName: DeleteBackupOptions) {
    return this._deleteBackup(backupName);
  }

  /**
   * Lists backups within a project or a specific index. Pass an indexName to list backups for that index,
   * otherwise the operation will return all backups in the project.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const backupsList = await pc.listBackups({ indexName: 'my-index', limit: 2 });
   * console.log(backupsList);
   * // {
   * //   data: [
   * //     {
   * //       backupId: '6a00902c-d118-4ad3-931c-49328c26d558',
   * //       sourceIndexName: 'my-index',
   * //       sourceIndexId: '0888b4d9-0b7b-447e-a403-ab057ceee4d4',
   * //       name: 'my-index-backup-2',
   * //       description: undefined,
   * //       status: 'Ready',
   * //       cloud: 'aws',
   * //       region: 'us-east-1',
   * //       dimension: 5,
   * //       metric: 'cosine',
   * //       recordCount: 200,
   * //       namespaceCount: 2,
   * //       sizeBytes: 67284,
   * //       tags: {},
   * //       createdAt: '2025-05-07T18:34:13.626650Z'
   * //     },
   * //     {
   * //       backupId: '2b362ea3-b7cf-4950-866f-0dff37ab781e',
   * //       sourceIndexName: 'my-index',
   * //       sourceIndexId: '0888b4d9-0b7b-447e-a403-ab057ceee4d4',
   * //       name: 'my-index-backup-1',
   * //       description: undefined,
   * //       status: 'Ready',
   * //       cloud: 'aws',
   * //       region: 'us-east-1',
   * //       dimension: 1024,
   * //       metric: 'cosine',
   * //       recordCount: 500,
   * //       namespaceCount: 4,
   * //       sizeBytes: 78294,
   * //       tags: {},
   * //       createdAt: '2025-05-07T18:33:59.888270Z'
   * //     },
   * //   ],
   * //   pagination: undefined
   * // }
   * ```
   *
   * @param options - A {@link ListBackupsOptions} object containing the optional indexName, limit, and paginationToken values.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to a {@link BackupList} object.
   */
  listBackups(options: ListBackupsOptions) {
    return this._listBackups(options);
  }

  /**
   * Lists restore jobs within a project.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const restoreJobsList = await pc.listRestoreJobs({ limit: 3 });
   * console.log(restoreJobsList);
   * // {
   * //   data: [
   * //     {
   * //       restoreJobId: '4d4c8693-10fd-4204-a57b-1e3e626fca07',
   * //       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //       targetIndexName: 'my-index-restore-1',
   * //       targetIndexId: 'deb7688b-9f21-4c16-8eb7-f0027abd27fe',
   * //       status: 'Completed',
   * //       createdAt: 2025-05-07T03:38:37.107Z,
   * //       completedAt: 2025-05-07T03:40:23.687Z,
   * //       percentComplete: 100
   * //     },
   * //     {
   * //       restoreJobId: 'c60a62e0-63b9-452a-88af-31d89c56c988',
   * //       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //       targetIndexName: 'my-index-restore-2',
   * //       targetIndexId: 'f2c9a846-799f-4b19-81a4-f3096b3d6114',
   * //       status: 'Completed',
   * //       createdAt: 2025-05-07T21:42:38.971Z,
   * //       completedAt: 2025-05-07T21:43:11.782Z,
   * //       percentComplete: 100
   * //     },
   * //     {
   * //       restoreJobId: '792837b7-8001-47bf-9c11-1859826b9c10',
   * //       backupId: '11450b9f-96e5-47e5-9186-03f346b1f385',
   * //       targetIndexName: 'my-index-restore-3',
   * //       targetIndexId: '620dda62-c999-4dd1-b083-6beb087b31e7',
   * //       status: 'Pending',
   * //       createdAt: 2025-05-07T21:48:39.580Z,
   * //       completedAt: 2025-05-07T21:49:12.084Z,
   * //       percentComplete: 45
   * //     }
   * //   ],
   * //   pagination: undefined
   * // }
   * ```
   *
   * @param options - A {@link ListBackupsOptions} object containing the optional indexName, limit, and paginationToken values.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to a {@link BackupList} object.
   */
  listRestoreJobs(options: ListRestoreJobsOptions) {
    return this._listRestoreJobs(options);
  }

  /**
   * Targets a specific index for performing data operations.
   *
   * You can target an index by providing its `name`, its `host`, or both. If only `name` is provided,
   * the SDK will call {@link describeIndex} to resolve the host. If `host` is provided, the SDK will
   * perform data operations directly against that host.
   *
   * #### Targeting an index by name (options object - recommended)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * const index = pc.index({ name: 'index-name' })
   * ```
   *
   * #### Targeting an index by name (legacy string syntax - deprecated)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * // Legacy syntax - will be removed in next major version
   * const index = pc.index('index-name')
   * ```
   *
   * #### Targeting an index by host
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * // You can find the host URL in the Pinecone console or via describeIndex()
   * const index = pc.index({ host: 'index-name-abc123.svc.pinecone.io' })
   * ```
   *
   * #### Targeting an index, with user-defined Metadata types
   *
   * If you are storing metadata alongside your vector values inside your Pinecone records, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking when upserting and querying data.
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   *
   * type MovieMetadata = {
   *   title: string,
   *   runtime: numbers,
   *   genre: 'comedy' | 'horror' | 'drama' | 'action'
   * }
   *
   * // Specify a custom metadata type while targeting the index
   * const index = pc.index<MovieMetadata>({ name: 'test-index' });
   *
   * // Now you get type errors if upserting malformed metadata
   * await index.upsert([{
   *   id: '1234',
   *   values: [
   *     .... // embedding values
   *   ],
   *   metadata: {
   *     genre: 'Gone with the Wind',
   *     runtime: 238,
   *     genre: 'drama',
   *
   *     // @ts-expect-error because category property not in MovieMetadata
   *     category: 'classic'
   *   }
   * }])
   *
   * const results = await index.query({
   *    vector: [
   *     ... // query embedding
   *    ],
   *    filter: { genre: { '$eq': 'drama' }}
   * })
   * const movie = results.matches[0];
   *
   * if (movie.metadata) {
   *   // Since we passed the MovieMetadata type parameter above,
   *   // we can interact with metadata fields without having to
   *   // do any typecasting.
   *   const { title, runtime, genre } = movie.metadata;
   *   console.log(`The best match in drama was ${title}`)
   * }
   * ```
   *
   * @typeParam T - The type of metadata associated with each record.
   * @param options - The {@link IndexOptions} for targeting the index.
   * @returns An {@link Index} object that can be used to perform data operations.
   */
  index<T extends RecordMetadata = RecordMetadata>(
    options: IndexOptions,
  ): Index<T>;
  /**
   * @deprecated Use the options object pattern instead: `pc.index({ name: 'index-name' })`.
   * This signature will be removed in the next major version.
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
   */
  // Alias method to match the Python SDK capitalization
  Index<T extends RecordMetadata = RecordMetadata>(
    options: IndexOptions,
  ): Index<T>;
  /**
   * @deprecated Use the options object pattern instead: `pc.Index({ name: 'index-name' })`.
   * This signature will be removed in the next major version.
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
   * Targets a specific assistant for performing operations.
   *
   * Once an assistant is targeted, you can perform operations such as uploading files,
   * updating instructions, and chatting.
   *
   * #### Targeting an assistant (options object - recommended)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'my-assistant' });
   *
   * // Upload a file to the assistant
   * await assistant.uploadFile({
   *   path: 'test-file.txt',
   *   metadata: { description: 'Sample test file' }
   * });
   * ```
   *
   * #### Targeting an assistant (legacy string syntax - deprecated)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * // Legacy syntax - will be removed in next major version
   * const assistant = pc.assistant('my-assistant');
   * ```
   *
   * #### Full example with chat
   *
   * ```typescript
   * const chatResp = await assistant.chat({
   *   messages: [{ role: 'user', content: 'What is the capital of France?' }],
   * });
   * console.log(chatResp);
   * // {
   * //  id: '000000000000000023e7fb015be9d0ad',
   * //  finishReason: 'stop',
   * //  message: {
   * //    role: 'assistant',
   * //    content: 'The capital of France is Paris.'
   * //  },
   * //  model: 'gpt-4o-2024-05-13',
   * //  citations: [ { position: 209, references: [Array] } ],
   * //  usage: { promptTokens: 493, completionTokens: 38, totalTokens: 531 }
   * // }
   * ```
   *
   * @param options - The {@link AssistantOptions} for targeting the assistant.
   * @returns An {@link Assistant} object that can be used to perform assistant-related operations.
   */
  assistant(options: AssistantOptions): Assistant;
  /**
   * @deprecated Use the options object pattern instead: `pc.assistant({ name: 'assistant-name' })`.
   * This signature will be removed in the next major version.
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
   */
  // Alias method
  Assistant(options: AssistantOptions): Assistant;
  /**
   * @deprecated Use the options object pattern instead: `pc.Assistant({ name: 'assistant-name' })`.
   * This signature will be removed in the next major version.
   */
  Assistant(name: string, host?: string): Assistant;
  Assistant(
    optionsOrName: AssistantOptions | string,
    host?: string,
  ): Assistant {
    return this.assistant(optionsOrName as any, host);
  }
}
