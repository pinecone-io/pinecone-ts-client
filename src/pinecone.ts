import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from './pinecone-generated-ts-fetch';
import {
  IndexOperationsApi,
  Configuration as ApiConfiguration,
} from './pinecone-generated-ts-fetch';
import {
  describeIndex,
  listIndexes,
  createIndex,
  deleteIndex,
  configureIndex,
  listCollections,
  createCollection,
  describeCollection,
  deleteCollection,
  ConfigureIndexOptions,
  CreateCollectionOptions,
  CreateIndexOptions,
  IndexName,
  CollectionName,
} from './control';
import type { IndexDescription } from './control';
import { HostUrlSingleton } from './data/hostUrlSingleton';
import {
  PineconeConfigurationError,
  PineconeEnvironmentVarsNotSupportedError,
} from './errors';
import { middleware } from './utils/middleware';
import { Index, PineconeConfigurationSchema } from './data';
import { buildValidator } from './validator';
import { queryParamsStringify, buildUserAgent, getFetch } from './utils';
import type { PineconeConfiguration, RecordMetadata } from './data';

/**
 * The `Pinecone` class is the main entrypoint to this sdk. You will use
 * instances of it to create and manage indexes as well as perform data
 * operations on those indexes after they are created.
 *
 * ### Initializing the client
 *
 * There are two pieces of configuration required to use the Pinecone client: an API key and environment value. These values can be passed using environment variables or in code through a configuration object. Find your configuration values in the console dashboard at [https://app.pinecone.io](https://app.pinecone.io)
 *
 * ### Using environment variables
 *
 * The environment variables used to configure the client are the following:
 *
 * ```bash
 * export PINECONE_API_KEY="your_api_key"
 * export PINECONE_ENVIRONMENT="your_environment"
 * ```
 *
 * When these environment variables are set, the client constructor does not require any additional arguments.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pinecone = new Pinecone();
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
 * const pinecone = new Pinecone({
 *   apiKey: 'your_api_key',
 *   environment: 'your_environment',
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

  /**
   * @example
   * ```
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pinecone = new Pinecone({
   *  apiKey: 'my-api-key',
   *  environment: 'us-west1-gcp'
   * });
   * ```
   *
   * @constructor
   * @param options - The configuration options for the Pinecone client.
   */
  constructor(options?: PineconeConfiguration) {
    if (options === undefined) {
      options = this._readEnvironmentConfig();
    }

    this._validateConfig(options);

    this.config = options;

    const { apiKey } = options;
    // const controllerPath = `https://controller.${environment}.pinecone.io`;
    const controllerPath = `https://api.pinecone.io`;
    const apiConfig: IndexOperationsApiConfigurationParameters = {
      basePath: controllerPath,
      apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(false),
      },
      fetchApi: getFetch(options),
      middleware,
    };
    const api = new IndexOperationsApi(new ApiConfiguration(apiConfig));

    this._configureIndex = configureIndex(api);
    this._createCollection = createCollection(api);
    this._createIndex = createIndex(api);
    this._describeCollection = describeCollection(api);
    this._deleteCollection = deleteCollection(api);
    this._describeIndex = describeIndex(api, this._handleDescribeIndex);
    this._deleteIndex = deleteIndex(api);
    this._listCollections = listCollections(api);
    this._listIndexes = listIndexes(api);
  }

  /**
   * @internal
   * Used as a callback by {@link Pinecone.describeIndex} to cache any index host URLs that are returned.
   * This bypasses the need to fetch the host on subsequent dataplane calls.
   */
  _handleDescribeIndex(response: IndexDescription, indexName: IndexName) {
    if (response.status?.host) {
      HostUrlSingleton._set(this.config, indexName, response.status.host);
    }
  }

  /**
   * @internal
   * This method is used by {@link Pinecone.constructor} to read configuration from environment variables.
   *
   * It looks for the following environment variables:
   * - `PINECONE_ENVIRONMENT`
   * - `PINECONE_API_KEY`
   * - `PINECONE_PROJECT_ID`
   *
   * @returns A {@link PineconeConfiguration} object populated with values found in environment variables.
   */
  _readEnvironmentConfig(): PineconeConfiguration {
    if (typeof process === 'undefined' || !process || !process.env) {
      throw new PineconeEnvironmentVarsNotSupportedError(
        'Your execution environment does not support reading environment variables from process.env, so a configuration object is required when calling new Pinecone()'
      );
    }

    const environmentConfig = {};
    const requiredEnvVarMap = {
      environment: 'PINECONE_ENVIRONMENT',
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
          ', '
        )}.`
      );
    }

    const optionalEnvVarMap = { projectId: 'PINECONE_PROJECT_ID' };
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
   * const indexConfig = await pinecone.describeIndex('my-index')
   * console.log(indexConfig)
   * // {
   * //    database: {
   * //      name: 'my-index',
   * //      metric: 'cosine',
   * //      dimension: 256,
   * //      pods: 2,
   * //      replicas: 2,
   * //      shards: 1,
   * //      podType: 'p1.x2',
   * //      metadataConfig: { indexed: [Array] }
   * //    },
   * //    status: { ready: true, state: 'Ready' }
   * // }
   * ```
   *
   * @param indexName - The name of the index to describe.
   * @returns A promise that resolves to {@link IndexMeta}
   */
  describeIndex(indexName: IndexName) {
    return this._describeIndex(indexName);
  }

  /**
   * List all Pinecone indexes
   * @example
   * ```js
   * const indexes = await pinecone.listIndexes()
   * console.log(indexes)
   * // [ 'my-index', 'my-other-index' ]
   * ```
   *
   * @returns A promise that resolves to an array of index names
   */
  listIndexes() {
    return this._listIndexes();
  }

  /**
   * Creates a new index.
   *
   * @example
   * The minimum required configuration to create an index is the index name and dimension.
   * ```js
   * await pinecone.createIndex({ name: 'my-index', dimension: 128 })
   * ```
   * @example
   * In a more expansive example, you can specify the metric, number of pods, number of replicas, and pod type.
   * ```js
   * await pinecone.createIndex({
   *  name: 'my-index',
   *  dimension: 1536,
   *  metric: 'cosine',
   *  pods: 1,
   *  replicas: 2,
   *  podType: 'p1.x1'
   * })
   * ```
   *
   * @example
   * If you would like to create the index only if it does not already exist, you can use the `suppressConflicts` boolean option.
   * ```js
   * await pinecone.createIndex({
   *   name: 'my-index',
   *   dimension: 1536,
   *   suppressConflicts: true
   * })
   * ```
   *
   * @example
   * If you plan to begin upserting immediately after index creation is complete, you should use the `waitUntilReady` option. Otherwise, the index may not be ready to receive data operations when you attempt to upsert.
   * ```js
   * await pinecone.createIndex({
   *  name: 'my-index',
   *  dimension: 1536,
   *  waitUntilReady: true
   * });
   *
   * const records = [
   *   // PineconeRecord objects with your embedding values
   * ]
   * await pinecone.index('my-index').upsert(records)
   * ```
   *
   * @example
   * By default all metadata fields are indexed when records are upserted with metadata, but if you want to improve performance you can specify the specific fields you want to index. This example is showing a few hypothetical metadata fields, but the values you'd use depend on what metadata you plan to store with records in your Pinecone index.
   * ```js
   * await pinecone.createIndex({
   *   name: 'my-index',
   *   dimension: 1536,
   *   metadataConfig: { 'indexed' : ['productName', 'productDescription'] }
   * })
   * ```
   *
   * @param options - The index configuration.
   *
   * @see [Distance metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
   * @see [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes)
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are provided.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in your project.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters being specified or other problem such as project quotas limiting the creation of any additional indexes.
   *
   * @returns A promise that resolves when the request to create the index is completed. Note that the index is not immediately ready to use. You can use the `describeIndex` function to check the status of the index.
   */
  createIndex(options: CreateIndexOptions) {
    return this._createIndex(options);
  }

  /**
   * Deletes an index
   *
   * @example
   * ```js
   * await pinecone.deleteIndex('my-index')
   * ```
   *
   * @param indexName - The name of the index to delete.
   * @returns A promise that resolves when the request to delete the index is completed.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are provided
   */
  deleteIndex(indexName: IndexName) {
    return this._deleteIndex(indexName);
  }

  /**
   * Configure an index
   *
   * Use this method to update configuration on an existing index. You can update the number of pods, replicas, and pod type. You can also update the metadata configuration.
   *
   * @example
   * ```js
   * await pinecone.configureIndex('my-index', { replicas: 2, podType: 'p1.x2' })
   * ```
   *
   * @param indexName - The name of the index to configure.
   * @param options - The configuration properties you would like to update
   */
  configureIndex(indexName: IndexName, options: ConfigureIndexOptions) {
    return this._configureIndex(indexName, options);
  }

  /**
   * Create a new collection from an existing index
   *
   * @example
   * ```js
   * const indexList = await pinecone.listIndexes()
   * await pinecone.createCollection({
   *  name: 'my-collection',
   *  source: indexList[0]
   * })
   * ```
   *
   *
   * @param options - The collection configuration.
   * @param options.name - The name of the collection. Must be unique within the project and contain alphanumeric and hyphen characters. The name must start and end with alphanumeric characters.
   * @param options.source - The name of the index to use as the source for the collection.
   * @returns a promise that resolves when the request to create the collection is completed.
   */
  createCollection(options: CreateCollectionOptions) {
    return this._createCollection(options);
  }

  /**
   * List all collections in a project
   *
   * @example
   * ```js
   * await pinecone.listCollections()
   * ```
   *
   * @returns A promise that resolves to an array of collection objects.
   */
  listCollections() {
    return this._listCollections();
  }

  /**
   * Delete a collection by collection name
   *
   * @example
   * ```
   * const collectionList = await pinecone.listCollections()
   * const collectionName = collectionList[0]
   * await pinecone.deleteCollection(collectionName)
   * ```
   *
   * @param collectionName - The name of the collection to delete.
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
   * await pinecone.describeCollection('my-collection')
   * ```
   *
   * @param collectionName - The name of the collection to describe.
   * @returns A promise that resolves to a collection object with type {@link CollectionDescription}.
   */
  describeCollection(collectionName: CollectionName) {
    return this._describeCollection(collectionName);
  }

  /** @internal */
  _validateConfig(options: PineconeConfiguration) {
    buildValidator(
      'The client configuration',
      PineconeConfigurationSchema
    )(options);
  }

  /**
   * @returns The configuration object that was passed to the Pinecone constructor.
   */
  getConfig() {
    return this.config;
  }

  /**
   * Targets a specific index for performing data operations.
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pinecone = new Pinecone()
   * const index = pinecone.index('index-name')
   * ```
   *
   * #### Targeting an index, with user-defined Metadata types
   *
   * If you are storing metadata alongside your vector values inside your Pinecone records, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking when upserting and querying data.
   *
   * ```typescript
   * const pinecone = new Pinecone();
   *
   * type MovieMetadata = {
   *   title: string,
   *   runtime: numbers,
   *   genre: 'comedy' | 'horror' | 'drama' | 'action'
   * }
   *
   * // Specify a custom metadata type while targeting the index
   * const index = pinecone.index<MovieMetadata>('test-index');
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
   * @param indexName - The name of the index to target.
   * @typeParam T - The type of the metadata object associated with each record.
   * @returns An {@link Index} object that can be used to perform data operations.
   */
  index<T extends RecordMetadata = RecordMetadata>(indexName: string) {
    return new Index<T>(indexName, this.config);
  }

  /**
   * {@inheritDoc index}
   */
  // Alias method to match the Python SDK capitalization
  Index<T extends RecordMetadata = RecordMetadata>(indexName: string) {
    return this.index<T>(indexName);
  }
}
