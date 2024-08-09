import {
  CreateIndexRequest,
  IndexModel,
  ManageIndexesApi,
  PodSpecMetadataConfig,
  ServerlessSpecCloudEnum,
} from '../pinecone-generated-ts-fetch/control';
// import { buildConfigValidator } from '../validator';
import { debugLog } from '../utils';
import { handleApiError, PineconeArgumentError } from '../errors';
// import { Type } from '@sinclair/typebox';
// import {
//   IndexNameSchema,
//   CloudSchema,
//   DimensionSchema,
//   EnvironmentSchema,
//   MetricSchema,
//   PodsSchema,
//   RegionSchema,
//   ReplicasSchema,
//   PodTypeSchema,
//   MetadataConfigSchema,
//   CollectionNameSchema,
//   ShardsSchema,
// } from './types';

/**
 * @see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
 */
export interface CreateIndexOptions extends Omit<CreateIndexRequest, 'spec'> {
  /** This option specifies how the index should be deployed. */
  spec: CreateIndexSpec;

  /** This option tells the client not to resolve the returned promise until the index is ready to receive data. */
  waitUntilReady?: boolean;

  /** This option tells the client not to throw if you attempt to create an index that already exists. */
  suppressConflicts?: boolean;
}

/**
 * The spec object defines how the index should be deployed.
 *
 * For serverless indexes, you define only the [cloud and region](http://docs.pinecone.io/guides/indexes/understanding-indexes#cloud-regions) where the index should be hosted.
 * For pod-based indexes, you define the [environment](http://docs.pinecone.io/guides/indexes/understanding-indexes#pod-environments) where the index should be hosted,
 * the [pod type and size](http://docs.pinecone.io/guides/indexes/understanding-indexes#pod-types) to use, and other index characteristics.
 */
export interface CreateIndexSpec {
  /** The serverless object allows you to configure a serverless index. */
  serverless?: CreateIndexServerlessSpec;

  /** The pod object allows you to configure a pods-based index. */
  pod?: CreateIndexPodSpec;
}

/**
 * Configuration needed to deploy a serverless index.
 *
 * @see [Understanding Serverless indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#serverless-indexes)
 */
export interface CreateIndexServerlessSpec {
  /** The public cloud where you would like your index hosted. */
  cloud: ServerlessSpecCloudEnum;

  /** The region where you would like your index to be created. */
  region: string;
}

/**
 * Configuration needed to deploy a serverless index.
 *
 * @see [Understanding Pod-based indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#pod-based-indexes)
 */
export interface CreateIndexPodSpec {
  /** The environment where the index is hosted. */
  environment: string;

  /** The number of replicas. Replicas duplicate your index. They provide higher availability and throughput. Replicas can be scaled up or down as your needs change. */
  replicas?: number;

  /** The number of shards. Shards split your data across multiple pods so you can fit more data into an index. */
  shards?: number;

  /** The type of pod to use. One of `s1`, `p1`, or `p2` appended with `.` and one of `x1`, `x2`, `x4`, or `x8`. */
  podType: string;

  /** The number of pods to be used in the index. This should be equal to `shards` x `replicas`.' */
  pods?: number;

  /**
   * Configuration for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed;
   * when `metadataConfig` is present, only specified metadata fields are indexed. These configurations are only valid
   * for use with pod-based indexes.
   */
  metadataConfig?: PodSpecMetadataConfig;

  /** The name of the collection to be used as the source for the index. */
  sourceCollection?: string;
}

// const CreateIndexOptionsSchema = Type.Object(
//   {
//     name: IndexNameSchema,
//     dimension: DimensionSchema,
//     metric: MetricSchema,
//     deletionProtection: Type.Optional(Type.String()),
//     spec: Type.Object({
//       serverless: Type.Optional(
//         Type.Object({
//           cloud: CloudSchema,
//           region: RegionSchema,
//         })
//       ),
//
//       pod: Type.Optional(
//         Type.Object({
//           environment: EnvironmentSchema,
//           replicas: Type.Optional(ReplicasSchema),
//           shards: Type.Optional(ShardsSchema),
//           podType: Type.Optional(PodTypeSchema),
//           pods: Type.Optional(PodsSchema),
//           metadataConfig: Type.Optional(MetadataConfigSchema),
//           sourceCollection: Type.Optional(CollectionNameSchema),
//         })
//       ),
//     }),
//
//     waitUntilReady: Type.Optional(Type.Boolean()),
//     suppressConflicts: Type.Optional(Type.Boolean()),
//   },
//   { additionalProperties: false }
// );

function isServerlessSpecCloudEnum(obj: any): obj is ServerlessSpecCloudEnum {
  return typeof obj === 'string' && ['gcp', 'aws', 'azure'].includes(obj);
}

function isValidMetric(obj: any): obj is string {
  return (
    typeof obj === 'string' &&
    ['cosine', 'euclidean', 'dotproduct'].includes(obj)
  );
}

function isValidPodType(obj: any): obj is string {
  return (
    typeof obj === 'string' &&
    [
      's1.x1',
      's1.x2',
      's1.x4',
      's1.x8',
      'p1.x1',
      'p1.x2',
      'p1.x4',
      'p1.x8',
      'p2.x1',
      'p2.x2',
      'p2.x4',
      'p2.x8',
    ].includes(obj)
  );
}

function isValidMetadataConfig(obj: any): obj is PodSpecMetadataConfig {
  return (
    typeof obj === 'object' &&
    obj.key === 'indexed' &&
    Array.isArray(obj.indexed) &&
    obj.indexed.every((field) => typeof field === 'string')
  );
}

function isCreateIndexServerlessSpec(
  obj: any
): obj is CreateIndexServerlessSpec {
  return (
    typeof obj === 'object' &&
    obj.cloud &&
    isServerlessSpecCloudEnum(obj.cloud) &&
    obj.region &&
    typeof obj.region === 'string'
  );
}

function isCreateIndexPodSpec(obj: any): obj is CreateIndexPodSpec {
  return (
    typeof obj === 'object' &&
    obj.environment &&
    typeof obj.environment === 'string' &&
    obj.podType &&
    typeof obj.podType == 'string'
  );
}

function isCreateIndexSpec(obj: any): obj is CreateIndexSpec {
  return (
    typeof obj === 'object' &&
    (typeof obj.metric === 'undefined' || isValidMetric(obj.metric)) &&
    (typeof obj.metadataConfig === 'undefined' ||
      isValidMetadataConfig(obj.metadataConfig)) &&
    (typeof obj.serverless === 'undefined' ||
      isCreateIndexServerlessSpec(obj.serverless)) &&
    (typeof obj.pod === 'undefined' || isCreateIndexPodSpec(obj.pod))
  );
}

export const createIndex = (api: ManageIndexesApi) => {
  const createIndexValidator = (options: CreateIndexOptions) => {
    if (options) {
      // Confirm req'd fields present (name, dimension, spec)
      if (!options['name']) {
        throw new PineconeArgumentError(
          'All calls to createIndex must include a `name` field.'
        );
      }
      if (!options['dimension']) {
        throw new PineconeArgumentError(
          'All calls to createIndex must include a `dimension` field.'
        );
      }
      if (!options['spec']) {
        throw new PineconeArgumentError(
          'All calls to createIndex must include a `spec` object of type CreateIndexSpec.'
        );
      }

      if (!isCreateIndexSpec(options.spec)) {
        throw new PineconeArgumentError(
          'The `spec` object does not conform to the required structure.'
        );
      }
    }

    // General checks
    if (
      !options ||
      typeof options !== 'object' ||
      Array.isArray(options) ||
      Object.keys(options).length === 0
    ) {
      throw new PineconeArgumentError(
        'The argument passed to createIndex must be a non-empty object.'
      );
    }

    // If metric is not specified, default to cosine
    if (options && !options.metric) {
      options.metric = 'cosine';
    }
  };

  return async (options: CreateIndexOptions): Promise<IndexModel | void> => {
    createIndexValidator(options);

    try {
      const createResponse = await api.createIndex({
        createIndexRequest: options as CreateIndexRequest,
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
  api: ManageIndexesApi,
  indexName: string,
  seconds: number = 0
): Promise<IndexModel> => {
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
