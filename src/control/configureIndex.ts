import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
  ConfigureIndexRequestEmbed,
  ConfigureIndexRequestSpec,
  X_PINECONE_API_VERSION,
  instanceOfBYOC,
  instanceOfPodBased,
  instanceOfServerless,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import type { IndexName } from './types';
import {
  CreateIndexReadCapacity,
  toApiReadCapacity,
  validateReadCapacity,
} from './createIndex';
import { describeIndex } from './describeIndex';

/**
 * Options for configuring an index.
 * @see [Manage Indexes](https://docs.pinecone.io/guides/manage-data/manage-indexes)
 */
export type ConfigureIndexOptions = {
  /**
   * The name of the index to configure.
   */
  name: IndexName;
  /**
   * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection) is enabled/disabled for the index.
   * Possible values: `disabled` or `enabled`.
   */
  deletionProtection?: string;
  /**
   * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.
   * Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
   */
  tags?: { [key: string]: string };
  /**
   * The integrated inference embedding settings for this index.
   */
  embed?: ConfigureIndexRequestEmbed;
  /**
   * The number of replicas. Replicas duplicate your index. They provide higher availability and throughput. Replicas can be scaled up or down as your needs change.
   */
  podReplicas?: number;
  /**
   * The type of pod to use. One of `s1`, `p1`, or `p2` appended with `.` and one of `x1`, `x2`, `x4`, or `x8`.
   */
  podType?: string;
  /**
   * The read capacity configuration for serverless and BYOC indexes.
   * Configures whether the index uses on-demand or dedicated read capacity.
   *
   * @see [Dedicated Read Nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
   */
  readCapacity?: CreateIndexReadCapacity;
};

export const configureIndex = (api: ManageIndexesApi) => {
  const validator = (options: ConfigureIndexOptions) => {
    if (!options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` to configureIndex.',
      );
    }

    // !options.deletionProtection evaluates to false if options.deletionProtection is undefined, empty string, or
    // not provided
    if (
      !options.deletionProtection &&
      !options.tags &&
      !options.embed &&
      options.podReplicas === undefined &&
      options.podType === undefined &&
      options.readCapacity === undefined
    ) {
      throw new PineconeArgumentError(
        'You must pass at least one configuration option to configureIndex.',
      );
    }

    if (options.readCapacity) {
      validateReadCapacity(options.readCapacity);
    }
  };

  return async (options: ConfigureIndexOptions): Promise<IndexModel> => {
    validator(options);

    // Describe the index to determine its spec type
    const indexDescription = await describeIndex(api)(options.name);
    const specType = getIndexSpecType(indexDescription.spec);

    // Validate that spec-specific parameters match the index type
    if (specType === 'pod' && options.readCapacity !== undefined) {
      throw new PineconeArgumentError(
        'Cannot configure readCapacity on a pod index; readCapacity is only supported for serverless and BYOC indexes.',
      );
    }
    if (
      (specType === 'serverless' || specType === 'byoc') &&
      (options.podReplicas !== undefined || options.podType !== undefined)
    ) {
      throw new PineconeArgumentError(
        `Cannot configure podReplicas or podType on a ${specType} index; these parameters are only supported for pod indexes.`,
      );
    }

    const spec = buildConfigureSpec(options, specType);
    const request: ConfigureIndexRequest = {
      deletionProtection: options.deletionProtection,
      tags: options.tags,
      embed: options.embed,
      spec,
    };

    return await api.configureIndex({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      indexName: options.name,
      configureIndexRequest: request,
    });
  };
};

/**
 * Helper function to determine the spec type of an index using generated helper functions.
 * @param spec - The IndexModelSpec from describeIndex
 * @returns The spec type: 'pod', 'serverless', or 'byoc'
 */
const getIndexSpecType = (
  spec: any,
): 'pod' | 'serverless' | 'byoc' | 'unknown' => {
  if (instanceOfPodBased(spec)) {
    return 'pod';
  }
  if (instanceOfServerless(spec)) {
    return 'serverless';
  }
  if (instanceOfBYOC(spec)) {
    return 'byoc';
  }
  return 'unknown';
};

const buildConfigureSpec = (
  options: ConfigureIndexOptions,
  specType: 'pod' | 'serverless' | 'byoc' | 'unknown',
): ConfigureIndexRequestSpec | undefined => {
  const hasPod =
    options.podReplicas !== undefined || options.podType !== undefined;
  const hasReadCapacity = options.readCapacity !== undefined;

  if (hasPod && hasReadCapacity) {
    throw new PineconeArgumentError(
      'Cannot configure both readCapacity values for a pod index.',
    );
  }

  // Handle pod configuration
  if (hasPod && specType === 'pod') {
    return {
      pod: {
        replicas: options.podReplicas,
        podType: options.podType,
      },
    };
  }

  // Handle serverless configuration
  if (hasReadCapacity && specType === 'serverless') {
    return {
      serverless: {
        readCapacity: toApiReadCapacity(options.readCapacity),
      },
    };
  }

  // Handle BYOC configuration
  if (hasReadCapacity && specType === 'byoc') {
    return {
      byoc: {
        readCapacity: toApiReadCapacity(options.readCapacity),
      },
    };
  }

  return undefined;
};
