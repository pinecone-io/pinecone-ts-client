import {
  CreateIndexRequest,
  IndexModel,
  IndexSpec,
  ManageIndexesApi,
  MetadataSchema,
  PodSpecMetadataConfig,
  ReadCapacity,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import { debugLog } from '../utils';
import { PodType, ValidPodTypes } from './types';
import { handleApiError, PineconeArgumentError } from '../errors';
import { ValidateObjectProperties } from '../utils/validateObjectProperties';

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

  /** The byoc object allows you to configure a BYOC index. */
  byoc?: CreateIndexByocSpec;
}

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateIndexSpecType = keyof CreateIndexSpec;
const CreateIndexSpecProperties: CreateIndexSpecType[] = [
  'serverless',
  'pod',
  'byoc',
];

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

  /** The read capacity configuration for the index. Defaults to OnDemand if not provided. */
  readCapacity?: CreateIndexReadCapacity;

  /** The name of the collection to be used as the source for the index. NOTE: Collections can only be created from pods-based indexes. */
  sourceCollection?: string;

  /** Schema for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when `schema` is present, only fields which are present in the `fields` object with a `filterable: true` are indexed. Note that `filterable: false` is not currently supported. */
  schema?: MetadataSchema;
}

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateIndexServerlessSpecType = keyof CreateIndexServerlessSpec;
const CreateIndexServerlessSpecProperties: CreateIndexServerlessSpecType[] = [
  'cloud',
  'region',
  'sourceCollection',
  'schema',
  'readCapacity',
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

/**
 * Configuration needed to deploy a BYOC index.
 *
 * @see [Bring Your Own Cloud](https://docs.pinecone.io/guides/production/bring-your-own-cloud)
 */
export interface CreateIndexByocSpec {
  /** The environment identifier for the BYOC index. */
  environment: string;

  /** The metadata schema for the index. */
  schema?: MetadataSchema;
}

type CreateIndexByocSpecType = keyof CreateIndexByocSpec;
const CreateIndexByocSpecProperties: CreateIndexByocSpecType[] = [
  'environment',
];

/**
 * The allowed node types for dedicated read capacity determining the type of machines to use: `b1` or `t1`.
 * `t1` includes increased processing power and memory.
 */
export type DedicatedNodeType = 'b1' | 't1';

/**
 * On-demand read capacity configuration.
 * If CreateIndexReadCapacity or mode is omitted, the index will be created with on-demand read capacity.
 */
export type ReadCapacityOnDemandParams = {
  /** The mode of the index. */
  mode?: 'OnDemand';
};

/**
 * Dedicated read capacity configuration.
 *
 * @see [Dedicated Read Nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export type ReadCapacityDedicatedParams = {
  /** The mode of the index. */
  mode?: 'Dedicated';

  /** The type of machines to use. Available options: `b1`, `t1`. */
  nodeType: DedicatedNodeType;

  /** The configuration for manual scaling. */
  manual: {
    /** The number of replicas to use. Replicas duplicate the compute resources and data of an index, allowing higher query throughput and availability.
     * Setting replicas to 0 disables the index but can be used to reduce costs while usage is paused. */
    replicas: number;

    /** The number of shards to use. Shards determine the storage capacity of an index, with each shard providing 250 GB of storage. */
    shards: number;
  };
};

/** The read capacity configuration for the index. Default is on-demand. */
export type CreateIndexReadCapacity =
  | ReadCapacityOnDemandParams
  | ReadCapacityDedicatedParams;

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
      const createRequest: CreateIndexRequest = {
        ...options,
        spec: {
          ...options.spec,
          serverless: options.spec.serverless
            ? {
                ...options.spec.serverless,
                readCapacity: toApiReadCapacity(
                  options.spec.serverless?.readCapacity
                ),
              }
            : undefined,
        } as IndexSpec,
      };

      const createResponse = await api.createIndex({
        createIndexRequest: createRequest,
        xPineconeApiVersion: X_PINECONE_API_VERSION,
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

export const waitUntilIndexIsReady = async (
  api: ManageIndexesApi,
  indexName: string,
  seconds: number = 0
): Promise<IndexModel> => {
  try {
    const indexDescription = await api.describeIndex({
      indexName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
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
      'You must pass a `pods`, `serverless`, or `byoc` `spec` object in order to create an index.'
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

    // validate readCapacity if provided
    if (options.spec.serverless.readCapacity) {
      validateReadCapacity(options.spec.serverless.readCapacity);
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
  } else if (options.spec.byoc) {
    ValidateObjectProperties(options.spec.byoc, CreateIndexByocSpecProperties);
    // Validate that environment is passed
    if (!options.spec.byoc.environment) {
      throw new PineconeArgumentError(
        'You must pass an `environment` for the `CreateIndexByocSpec` object to create an index.'
      );
    }
  }
};

export const validateReadCapacity = (
  readCapacity: CreateIndexReadCapacity | undefined
) => {
  if (!readCapacity) return; // default to OnDemand

  // Validate mode if provided
  const mode = readCapacity.mode;
  if (
    mode &&
    mode.toLowerCase() !== 'ondemand' &&
    mode.toLowerCase() !== 'dedicated'
  ) {
    throw new PineconeArgumentError(
      `Invalid read capacity mode: ${mode}. Valid values are: 'OnDemand' or 'Dedicated'.`
    );
  }

  if (!isDedicated(readCapacity)) {
    // OnDemand mode: no dedicated fields provided
    return;
  }

  // Dedicated mode
  const { nodeType, manual } = readCapacity as ReadCapacityDedicatedParams;
  if (!nodeType || !['b1', 't1'].includes(nodeType)) {
    throw new PineconeArgumentError(
      `Invalid node type: ${nodeType}. Valid values are: 'b1' or 't1'.`
    );
  }
  if (!manual) {
    throw new PineconeArgumentError(
      'CreateIndexReadCapacity.manual is required for dedicated mode.'
    );
  }
  const { replicas, shards } = manual;
  if (!Number.isInteger(replicas) || replicas < 0) {
    throw new PineconeArgumentError(
      'CreateIndexReadCapacity.manual.replicas must be 0 or a positive integer.'
    );
  }
  if (!Number.isInteger(shards) || shards <= 0) {
    throw new PineconeArgumentError(
      'CreateIndexReadCapacity.manual.shards must be a positive integer.'
    );
  }
};

export const isDedicated = (
  rc: CreateIndexReadCapacity
): rc is ReadCapacityDedicatedParams =>
  !!rc &&
  typeof rc === 'object' &&
  (rc.mode?.toLowerCase() === 'dedicated' ||
    'nodeType' in rc ||
    'manual' in rc);

export const toApiReadCapacity = (
  rc: CreateIndexReadCapacity | undefined
): ReadCapacity | undefined => {
  if (!rc) return undefined;

  if (!isDedicated(rc)) {
    return { mode: 'OnDemand' };
  }

  const { nodeType, manual } = rc;
  return {
    mode: 'Dedicated',
    dedicated: {
      nodeType,
      scaling: 'Manual',
      manual: {
        replicas: manual.replicas,
        shards: manual.shards,
      },
    },
  };
};
