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
} from './control';
import {
  PineconeConfigurationError,
  PineconeEnvironmentVarsNotSupportedError,
} from './errors';
import { Index, PineconeConfigurationSchema } from './data';
import { buildValidator } from './validator';
import { queryParamsStringify, buildUserAgent } from './utils';
import type { PineconeConfiguration, RecordMetadata } from './data';

/**
 * @example
 * ```
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const client = new Pinecone();
 * ```
 */
export class Pinecone {
  /**
   * @example
   * ```
   * import { Pinecone } from '@pinecone-database/pinecone`
   * const client = new Pinecone({ apiKey: 'my-api-key', environment: 'us-west1-gcp', projectId: 'my-project-id' })
   * ```
   *
   * @constructor
   * @param options - The configuration options for the client.
   * @param options.apiKey - The API key for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   * @param options.environment - The environment for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   * @param options.projectId - The project ID for your Pinecone project. This optional field can be passed, but if it is not then it will be automatically fetched when needed.
   */
  constructor(options?: PineconeConfiguration) {
    if (options === undefined) {
      options = this._readEnvironmentConfig();
    }

    this._validateConfig(options);

    this.config = options;

    const { apiKey, environment } = options;
    const controllerPath = `https://controller.${environment}.pinecone.io`;
    const apiConfig: IndexOperationsApiConfigurationParameters = {
      basePath: controllerPath,
      apiKey,
      queryParamsStringify,
      headers: {
        'User-Agent': buildUserAgent(false),
      },
    };
    const api = new IndexOperationsApi(new ApiConfiguration(apiConfig));

    this.describeIndex = describeIndex(api);
    this.listIndexes = listIndexes(api);
    this.createIndex = createIndex(api);
    this.deleteIndex = deleteIndex(api);
    this.configureIndex = configureIndex(api);

    this.createCollection = createCollection(api);
    this.listCollections = listCollections(api);
    this.describeCollection = describeCollection(api);
    this.deleteCollection = deleteCollection(api);
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
    if (!process || !process.env) {
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
   * const indexConfig = await client.describeIndex('my-index')
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
  describeIndex: ReturnType<typeof describeIndex>;

  /**
   * List all Pinecone indexes
   * @example
   * ```js
   * const indexes = await client.listIndexes()
   * console.log(indexes)
   * // [ 'my-index', 'my-other-index' ]
   * ```
   *
   * @returns A promise that resolves to an array of index names
   */
  listIndexes: ReturnType<typeof listIndexes>;

  /**
   * Creates a new index.
   *
   * @example
   * The minimum required configuration to create an index is the index name and dimension.
   * ```js
   * await client.createIndex({ name: 'my-index', dimension: 128 })
   * ```
   * @example
   * In a more expansive example, you can specify the metric, number of pods, number of replicas, and pod type.
   * ```js
   * await client.createIndex({
   *  name: 'my-index',
   *  dimension: 128,
   *  metric: 'cosine',
   *  pods: 1,
   *  replicas: 2,
   *  podType: 'p1.x1'
   * })
   * ```
   *
   * @example
   * By default all metadata fields are indexed when records are upserted with metadata, but if you want to improve performance you can specify the specific fields you want to index. This example is showing a few hypothetical metadata fields, but the values you'd use depend on what metadata you plan to store with records in your Pinecone index.
   * ```js
   * await client.createIndex({ name: 'my-index', dimension: 128, metadataConfig: { 'indexed' : ['productName', 'productDescription'] }})
   * ```
   *
   * @param options - The index configuration.
   * @param options.name - The name of the index. Must be unique within the project and contain alphanumeric and hyphen characters. The name must start and end with alphanumeric characters.
   * @param options.dimension - The dimension of the index. Must be a positive integer. The number you choose here will depend on the model you are using. For example, if you are using a model that outputs 128-dimensional vectors, you should set the dimension to 128.
   * @param options.metric - The metric of the index. The default metric is `'cosine'`. Supported metrics include `'cosine'`, `'dotproduct'`, and `'euclidean'`. To learn more about these options, see [Distance metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
   * @param options.pods - The number of pods in the index. The default number of pods is 1.
   * @param options.replicas - The number of replicas in the index. The default number of replicas is 1.
   * @param options.podType - The type of pod in the index. This string should combine a base pod type (`s1`, `p1`, or `p2`) with a size (`x1`, `x2`, `x4`, or `x8`) into a string such as `p1.x1` or `s1.x4`. The default pod type is `p1.x1`. For more information on these, see this guide on [pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes)
   * @param options.metadataConfig - Configuration for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when a `metadataConfig` object is present, only metadata fields specified are indexed.
   * @param options.metadataConfig.indexed - An array of metadata fields to index. If this array is empty, no metadata is indexed. If this array is not present, all metadata is indexed.
   * @param options.sourceCollection - If creating an index from a collection, you can specify the name of the collection here.
   * @see [Distance metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
   * @see [Pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes)
   * @throws {@link PineconeArgumentError} when invalid arguments are provided.
   *
   * @returns A promise that resolves when the request to create the index is completed. Note that the index is not immediately ready to use. You can use the `describeIndex` function to check the status of the index.
   */
  createIndex: ReturnType<typeof createIndex>;

  /**
   * Deletes an index
   *
   * @example
   * ```js
   * await client.deleteIndex('my-index')
   * ```
   *
   * @param indexName - The name of the index to delete.
   * @returns A promise that resolves when the request to delete the index is completed.
   * @throws {@link PineconeArgumentError} when invalid arguments are provided
   */
  deleteIndex: ReturnType<typeof deleteIndex>;

  /**
   * Configure an index
   *
   * Use this method to update configuration on an existing index. You can update the number of pods, replicas, and pod type. You can also update the metadata configuration.
   *
   * @example
   * ```js
   * await client.configureIndex('my-index', { replicas: 2, podType: 'p1.x2' })
   * ```
   *
   * @param indexName - The name of the index to configure.
   * @param options - The configuration properties you would like to update
   * @param options.replicas - The number of replicas in the index. The default number of replicas is 1.
   * @param options.podType - The type of pod in the index. This string should combine a base pod type (`s1`, `p1`, or `p2`) with a size (`x1`, `x2`, `x4`, or `x8`) into a string such as `p1.x1` or `s1.x4`. The default pod type is `p1.x1`. For more information on these, see this guide on [pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes)
   * @param options.metadataConfig - Configuration for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when a `metadataConfig` object is present, only metadata fields specified are indexed.
   */
  configureIndex: ReturnType<typeof configureIndex>;

  /**
   * Create a new collection from an existing index
   *
   * @example
   * ```js
   * const indexList = await client.listIndexes()
   * await client.createCollection({
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
  createCollection: ReturnType<typeof createCollection>;

  /**
   * List all collections in a project
   *
   * @example
   * ```js
   * await client.listCollections()
   * ```
   *
   * @returns A promise that resolves to an array of collection objects.
   */
  listCollections: ReturnType<typeof listCollections>;

  /**
   * Delete a collection by collection name
   *
   * @example
   * ```
   * const collectionList = await client.listCollections()
   * const collectionName = collectionList[0]
   * await client.deleteCollection(collectionName)
   * ```
   *
   * @param collectionName - The name of the collection to delete.
   * @returns A promise that resolves when the request to delete the collection is completed.
   */
  deleteCollection: ReturnType<typeof deleteCollection>;

  /**
   * Describe a collection
   *
   * @example
   * ```js
   * await client.describeCollection('my-collection')
   * ```
   *
   * @param collectionName - The name of the collection to describe.
   * @returns A promise that resolves to a collection object with type {@link CollectionDescription}.
   */
  describeCollection: ReturnType<typeof describeCollection>;

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

  index<T extends RecordMetadata>(indexName: string) {
    return new Index<T>(indexName, this.config);
  }

  // Alias method to match the Python SDK capitalization
  Index<T extends RecordMetadata>(indexName: string) {
    return this.index<T>(indexName);
  }

  __curlStarter() {
    // Every endpoint is going to have a different path and expect different data (in the case of POST requests),
    // but this is a good starting point for users to see how to use curl to interact with the REST API.
    console.log('Example curl command to list indexes: ');
    console.log(
      `curl "https://controller.${this.config.environment}.pinecone.io/databases" -H "Api-Key: ${this.config.apiKey}" -H "Accept: application/json"`
    );
  }
}
