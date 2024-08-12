import {
  CreateIndexRequest,
  IndexModel,
  ManageIndexesApi,
  ServerlessSpecCloudEnum,
  PodSpecMetadataConfig,
  IndexModelMetricEnum,
} from '../pinecone-generated-ts-fetch/control';
import { debugLog } from '../utils';
import { ValidPodTypes } from './types';
import { handleApiError, PineconeArgumentError } from '../errors';

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

export const createIndex = (api: ManageIndexesApi) => {
  const validator = async (options: CreateIndexOptions) => {
    if (!options) {
      throw new PineconeArgumentError(
        'You must pass an object with required properties (`name`, `dimension`, `spec`) to create an index.'
      );
    }
    if (!options.name || options.name.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create an index.'
      );
    }
    if (!options.dimension || options.dimension <= 0) {
      throw new PineconeArgumentError(
        'You must pass a positive integer for `dimension` in order to create an index.'
      );
    }
    if (!options.spec) {
      throw new PineconeArgumentError(
        'You must pass a pods or serverless `spec` object in order to create an index.'
      );
    }
    if (options.spec.serverless) {
      if (!options.spec.serverless.cloud) {
        throw new PineconeArgumentError(
          'You must pass a `cloud` for the serverless `spec` object in order to create an index.'
        );
      }
      if (!options.spec.serverless.region) {
        throw new PineconeArgumentError(
          'You must pass a `region` for the serverless `spec` object in order to create an index.'
        );
      }
    }
    if (options.spec.pod) {
      if (!options.spec.pod.environment) {
        throw new PineconeArgumentError(
          'You must pass an `environment` for the pod `spec` object in order to create an index.'
        );
      }
      if (!options.spec.pod.podType) {
        throw new PineconeArgumentError(
          'You must pass a `podType` for the pod `spec` object in order to create an index.'
        );
      }
    }
    if (
      options.spec.serverless &&
      options.spec.serverless.cloud &&
      !Object.values(ServerlessSpecCloudEnum).includes(
        options.spec.serverless.cloud
      )
    ) {
      throw new PineconeArgumentError(
        `Invalid cloud value: ${
          options.spec.serverless.cloud
        }. Valid values are: ${Object.values(ServerlessSpecCloudEnum).join(
          ', '
        )}.`
      );
    }
    if (
      options.metric &&
      !Object.values(IndexModelMetricEnum).includes(options.metric)
    ) {
      {
        throw new PineconeArgumentError(
          `Invalid metric value: ${options.metric}. Valid values are: 'cosine', 'euclidean', or 'dotproduct.'`
        );
      }
    }
    if (
      options.spec.pod &&
      options.spec.pod.replicas &&
      options.spec.pod.replicas <= 0
    ) {
      throw new PineconeArgumentError(
        'You must pass a positive integer for `replicas` in order to create an index.'
      );
    }
    if (
      options.spec.pod &&
      options.spec.pod.pods &&
      options.spec.pod.pods <= 0
    ) {
      throw new PineconeArgumentError(
        'You must pass a positive integer for `pods` in order to create an index.'
      );
    }
    if (options.spec.pod && !ValidPodTypes.includes(options.spec.pod.podType)) {
      throw new PineconeArgumentError(
        `Invalid pod type: ${
          options.spec.pod.podType
        }. Valid values are: ${ValidPodTypes.join(', ')}.`
      );
    }
  };

  return async (options: CreateIndexOptions): Promise<IndexModel | void> => {
    // If metric is not specified, default to cosine
    if (options && !options.metric) {
      options.metric = IndexModelMetricEnum.Cosine;
    }
    await validator(options);
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
