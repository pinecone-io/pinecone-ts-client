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
import { Index } from './data';
import { buildValidator } from './validator';
import { queryParamsStringify, buildUserAgent } from './utils';
import { Static, Type } from '@sinclair/typebox';

const ClientConfigurationSchema = Type.Object(
  {
    environment: Type.String({ minLength: 1 }),
    apiKey: Type.String({ minLength: 1 }),
    projectId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false }
);

export type ClientConfiguration = Static<typeof ClientConfigurationSchema>;

/** Class representing a Pinecone client */
export class Client {
  /** @hidden */
  private config: ClientConfiguration;

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
   * By default all metadata fields are indexed when vectors are upserted with metadata, but if you want to improve performance you can specify the specific fields you want to index. This example is showing a few hypothetical metadata fields, but the values you'd use depend on what metadata you plan to store in Pinecone alongside your vectors.
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

  /**
   * Creates a new Pinecone client. Most users will not need to call this directly, but rather use the `Pinecone` {@link Pinecone.createClient} method which aggregates information from multiple configuration sources.
   *
   * @example
   * ```
   * import { Client } from '@pinecone-database/pinecone`
   * const client = new Client({ apiKey: 'my-api-key', environment: 'us-west1-gcp', projectId: 'my-project-id' })
   * ```
   *
   * @constructor
   * @param options - The configuration options for the client.
   * @param options.apiKey - The API key for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   * @param options.environment - The environment for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   * @param options.projectId - The project ID for your Pinecone project is determined by  calling the whoami endpoint using your API key and environment as parameters. Users will usually not do this themselves, but rather use the {@link Pincecone} `createClient` method.
   */
  constructor(options: ClientConfiguration) {
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

  /** @internal */
  _validateConfig(options: ClientConfiguration) {
    buildValidator(
      'The client configuration',
      ClientConfigurationSchema
    )(options);
  }

  /**
   * @returns The configuration object that was passed to the Client constructor.
   */
  getConfig() {
    return this.config;
  }

  index(indexName: string) {
    return new Index(indexName, this.config);
  }

  // Alias method to match the Python SDK capitalization
  Index(indexName: string) {
    return this.index(indexName);
  }
}
