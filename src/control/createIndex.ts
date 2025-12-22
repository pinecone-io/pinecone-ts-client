import {
  CreateIndexRequest,
  CreateIndexOperationRequest,
  IndexModel,
  ManageIndexesApi,
  PodSpecMetadataConfig,
  DescribeIndexRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import { debugLog } from '../utils';
import { PodType, ValidPodTypes } from './types';
import { handleApiError, PineconeArgumentError } from '../errors';
import { ValidateObjectProperties } from '../utils/validateObjectProperties';
import { withControlApiVersion } from './apiVersion';

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

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateIndexOptionsType = keyof CreateIndexOptions;
const CreateIndexOptionsProperties: CreateIndexOptionsType[] = [
  'spec',
  'name',
  'dimension',
  'metric',
  'deletionProtection',
  'waitUntilReady',
  'suppressConflicts',
  'tags',
  'vectorType',
];

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

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateIndexSpecType = keyof CreateIndexSpec;
const CreateIndexSpecProperties: CreateIndexSpecType[] = ['serverless', 'pod'];

/**
 * Configuration needed to deploy a serverless index.
 *
 * @see [Understanding Serverless indexes](https://docs.pinecone.io/guides/indexes/understanding-indexes#serverless-indexes)
 */
export interface CreateIndexServerlessSpec {
  /** The public cloud where you would like your index hosted. */
  cloud: string;

  /** The region where you would like your index to be created. */
  region: string;

  /** The name of the collection to be used as the source for the index. NOTE: Collections can only be created from pods-based indexes. */
  sourceCollection?: string;
}

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateIndexServerlessSpecType = keyof CreateIndexServerlessSpec;
const CreateIndexServerlessSpecProperties: CreateIndexServerlessSpecType[] = [
  'cloud',
  'region',
  'sourceCollection',
];

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

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateIndexPodSpecType = keyof CreateIndexPodSpec;
const CreateIndexPodSpecProperties: CreateIndexPodSpecType[] = [
  'environment',
  'replicas',
  'shards',
  'podType',
  'pods',
  'metadataConfig',
  'sourceCollection',
];

export const createIndex = (api: ManageIndexesApi) => {
  return async (options: CreateIndexOptions): Promise<IndexModel | void> => {
    if (!options) {
      throw new PineconeArgumentError(
        'You must pass an object with required properties (`name`, `dimension`, `spec`) to create an index.'
      );
    }

    // If metric is not specified for a sparse index, default to dotproduct
    if (options.vectorType && options.vectorType.toLowerCase() === 'sparse') {
      if (!options.metric) {
        options.metric = 'dotproduct';
      }
    } else {
      // If metric is not specified for a dense index, default to cosine
      if (!options.metric) {
        options.metric = 'cosine';
      }
    }

    validateCreateIndexRequest(options);
    try {
      const createResponse = await api.createIndex(
        withControlApiVersion<CreateIndexOperationRequest>({
          createIndexRequest: options as CreateIndexRequest,
        })
      );
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

export const waitUntilIndexIsReady = async (
  api: ManageIndexesApi,
  indexName: string,
  seconds: number = 0
): Promise<IndexModel> => {
  try {
    const indexDescription = await api.describeIndex(
      withControlApiVersion<DescribeIndexRequest>({ indexName })
    );
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

const validateCreateIndexRequest = (options: CreateIndexOptions) => {
  // validate options properties
  if (options) {
    ValidateObjectProperties(options, CreateIndexOptionsProperties);
  }
  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create an index.'
    );
  }
  if (options.dimension && options.dimension <= 0) {
    throw new PineconeArgumentError(
      'You must pass a positive integer for `dimension` in order to create an index.'
    );
  }

  // validate options.spec properties
  if (!options.spec) {
    throw new PineconeArgumentError(
      'You must pass a `pods` or `serverless` `spec` object in order to create an index.'
    );
  }
  if (options.spec) {
    ValidateObjectProperties(options.spec, CreateIndexSpecProperties);
  }

  // validate options.metric
  if (
    options.metric &&
    !['cosine', 'euclidean', 'dotproduct'].includes(
      options.metric.toLowerCase()
    )
  ) {
    {
      throw new PineconeArgumentError(
        `Invalid metric value: ${options.metric}. Valid values are: 'cosine', 'euclidean', or 'dotproduct.'`
      );
    }
  }

  // validate options.spec.serverless properties if serverless spec is passed
  if (options.spec.serverless) {
    ValidateObjectProperties(
      options.spec.serverless,
      CreateIndexServerlessSpecProperties
    );

    // extract and default vectorType to 'dense' if not specified
    const vectorType = options.vectorType
      ? options.vectorType.toLowerCase()
      : 'dense';
    if (vectorType !== 'dense' && vectorType !== 'sparse') {
      throw new PineconeArgumentError(
        'Invalid `vectorType` value. Valid values are `dense` or `sparse`.'
      );
    }

    // sparse indexes must have a metric of 'dotproduct' and no dimension
    if (vectorType == 'sparse') {
      if (options.dimension && options.dimension > 0) {
        throw new PineconeArgumentError(
          'Sparse indexes cannot have a `dimension`.'
        );
      }

      if (options.metric && options.metric !== 'dotproduct') {
        throw new PineconeArgumentError(
          'Sparse indexes must have a `metric` of `dotproduct`.'
        );
      }
    } else if (vectorType == 'dense') {
      // dense indexes must have a dimension
      if (!options.dimension || options.dimension <= 0) {
        throw new PineconeArgumentError(
          'You must pass a positive `dimension` when creating a dense index.'
        );
      }
    }

    // validate serverless cloud & region
    if (!options.spec.serverless.cloud) {
      throw new PineconeArgumentError(
        'You must pass a `cloud` for the serverless `spec` object in order to create an index.'
      );
    }
    if (
      options.spec.serverless.cloud &&
      !['aws', 'gcp', 'azure'].includes(
        options.spec.serverless.cloud.toLowerCase()
      )
    ) {
      throw new PineconeArgumentError(
        `Invalid cloud value: ${options.spec.serverless.cloud}. Valid values are: aws, gcp, or azure.`
      );
    }
    if (!options.spec.serverless.region) {
      throw new PineconeArgumentError(
        'You must pass a `region` for the serverless `spec` object in order to create an index.'
      );
    }
  } else if (options.spec.pod) {
    // validate options.spec.pod properties if pod spec is passed
    ValidateObjectProperties(options.spec.pod, CreateIndexPodSpecProperties);
    if (!options.spec.pod.environment) {
      throw new PineconeArgumentError(
        'You must pass an `environment` for the pod `spec` object in order to create an index.'
      );
    }

    // pod indexes must have a dimension
    if (!options.dimension || options.dimension <= 0) {
      throw new PineconeArgumentError(
        'You must pass a positive `dimension` when creating a dense index.'
      );
    }

    // pod indexes must be dense
    const vectorType = 'dense';
    if (options.vectorType && options.vectorType.toLowerCase() !== vectorType) {
      throw new PineconeArgumentError(
        'Pod indexes must have a `vectorType` of `dense`.'
      );
    }

    if (!options.spec.pod.podType) {
      throw new PineconeArgumentError(
        'You must pass a `podType` for the pod `spec` object in order to create an index.'
      );
    }
    if (options.spec.pod.replicas && options.spec.pod.replicas <= 0) {
      throw new PineconeArgumentError(
        'You must pass a positive integer for `replicas` in order to create an index.'
      );
    }
    if (options.spec.pod.pods && options.spec.pod.pods <= 0) {
      throw new PineconeArgumentError(
        'You must pass a positive integer for `pods` in order to create an index.'
      );
    }
    if (!ValidPodTypes.includes(<PodType>options.spec.pod.podType)) {
      throw new PineconeArgumentError(
        `Invalid pod type: ${
          options.spec.pod.podType
        }. Valid values are: ${ValidPodTypes.join(', ')}.`
      );
    }
  }
};
