import { IndexMeta, IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { debugLog } from '../utils';
import { handleApiError } from '../errors';
import { Type } from '@sinclair/typebox';
import {
  IndexNameSchema,
  CapacityModeSchema,
  CloudSchema,
  DimensionSchema,
  EnvironmentSchema,
  MetricSchema,
  PodsSchema,
  RegionSchema,
  ReplicasSchema,
  PodTypeSchema,
  MetadataConfigSchema,
  CollectionNameSchema,
} from './types';
import type { IndexName, PodType } from './types';

/**
 * @see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
 */
export type CreateIndexOptions = {
  /** The name of the index. Must be unique within the project and contain alphanumeric and hyphen characters. The name must start and end with alphanumeric characters. */
  name: IndexName;

  /** The dimension of the index. Must be a positive integer. The dimension of your index should match the output dimension of your embedding model. For example, if you are using a model that outputs 128-dimensional vectors, you should set the dimension to 128. */
  dimension: number;

  /**
   * The region where you would like your index to be created
   */
  region: string;

  /**
   * The public cloud where you would like your index hosted
   */
  cloud: 'gcp' | 'aws' | 'azure';

  /**
   * The environment where you would like your index to be created
   */
  environment?: string;

  /**
   * The capacity mode for the index.
   */
  capacityMode: string;

  /**
   * The metric specifies how similarity is calculated in the index when querying. The default metric is `'cosine'`. Supported metrics include `'cosine'`, `'dotproduct'`, and `'euclidean'`. To learn more about these options, see [Distance metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
   *
   * @defaultValue `"cosine"`
   *
   * */
  metric?: 'cosine' | 'dotproduct' | 'euclidean' | string;

  /** The number of pods in the index. The default number of pods is 1. */
  pods?: number;

  /** The number of replicas in the index. The default number of replicas is 1. */
  replicas?: number;

  /** The number of shards to be used in the index. */
  shards?: number;

  /**
   * The type of pod in the index. This string should combine a base pod type (`s1`, `p1`, or `p2`) with a size (`x1`, `x2`, `x4`, or `x8`) into a string such as `p1.x1` or `s1.x4`. The default pod type is `p1.x1`. For more information on these, see this guide on [pod types and sizes](https://docs.pinecone.io/docs/indexes#pods-pod-types-and-pod-sizes).
   *
   * @defaultValue `"p1.x1"`
   * */
  podType?: PodType;

  /** Configuration for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when a `metadataConfig` object is present, only metadata fields specified are indexed. */
  metadataConfig?: {
    /**
     * Specify an array of metadata fields you would like indexed.
     *
     * @see [Filtering with metadata](https://docs.pinecone.io/docs/metadata-filtering)
     * */
    indexed: Array<string>;
  };

  /** If creating an index from a collection, you can specify the name of the collection here. */
  sourceCollection?: string;

  /** This option tells the client not to resolve the returned promise until the index is ready to receive data. */
  waitUntilReady?: boolean;

  /** This option tells the client not to throw if you attempt to create an index that already exists. */
  suppressConflicts?: boolean;
};

const CreateIndexOptionsSchema = Type.Object(
  {
    name: IndexNameSchema,
    dimension: DimensionSchema,
    region: RegionSchema,
    cloud: CloudSchema,
    capacityMode: CapacityModeSchema,
    metric: Type.Optional(MetricSchema),
    pods: Type.Optional(PodsSchema),
    replicas: Type.Optional(ReplicasSchema),
    podType: Type.Optional(PodTypeSchema),
    environment: Type.Optional(EnvironmentSchema),
    metadataConfig: Type.Optional(MetadataConfigSchema),
    sourceCollection: Type.Optional(CollectionNameSchema),
    waitUntilReady: Type.Optional(Type.Boolean()),
    suppressConflicts: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false }
);

export const createIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CreateIndexOptionsSchema,
    'createIndex'
  );

  return async (
    options: CreateIndexOptions
  ): Promise<IndexMeta | undefined> => {
    validator(options);
    try {
      const createResponse = await api.createIndex({
        createRequest: options,
      });
      if (options.waitUntilReady) {
        return await waitUntilIndexIsReady(api, options.name);
      }
      return createResponse;
    } catch (e) {
      if (
        !(
          options.suppressConflicts &&
          e instanceof Error &&
          e.name === 'PineconeConflictError'
        )
      ) {
        throw e;
      }
    }
  };
};

const waitUntilIndexIsReady = async (
  api: IndexOperationsApi,
  indexName: string,
  seconds: number = 0
): Promise<IndexMeta> => {
  try {
    const indexDescription = await api.describeIndex({ indexName });
    if (!indexDescription.status?.ready) {
      await new Promise((r) => setTimeout(r, 1000));
      return await waitUntilIndexIsReady(api, indexName, seconds + 1);
    } else {
      debugLog(`Index ${indexName} is ready after ${seconds}`);
      return indexDescription;
    }
  } catch (e) {
    const err = await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating index ${indexName}: ${rawMessageText}`
    );
    throw err;
  }
};
