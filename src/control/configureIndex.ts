import {
  ManageIndexesApi,
  IndexModel,
  ConfigureIndexRequest,
  ConfigureIndexRequestEmbed,
  ConfigureIndexRequestSpec,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import type { IndexName } from './types';
import {
  CreateIndexReadCapacity,
  toApiReadCapacity,
  validateReadCapacity,
} from './createIndex';

/**
 * Options for configuring an index.
 * @see [Manage Indexes](https://docs.pinecone.io/guides/manage-data/manage-indexes)
 */
export type ConfigureIndexOptions = {
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
   * The read capacity configuration for dedicated read nodes.
   *
   * @see [Dedicated Read Nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
   */
  readCapacity?: CreateIndexReadCapacity;
};

export const configureIndex = (api: ManageIndexesApi) => {
  const validator = (indexName: IndexName, options: ConfigureIndexOptions) => {
    if (!indexName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `indexName` to configureIndex.',
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

  return async (
    indexName: IndexName,
    options: ConfigureIndexOptions,
  ): Promise<IndexModel> => {
    validator(indexName, options);

    const spec = buildConfigureSpec(options);
    const request: ConfigureIndexRequest = {
      deletionProtection: options.deletionProtection,
      tags: options.tags,
      embed: options.embed,
      spec,
    };

    return await api.configureIndex({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      indexName,
      configureIndexRequest: request,
    });
  };
};

const buildConfigureSpec = (
  options: ConfigureIndexOptions,
): ConfigureIndexRequestSpec | undefined => {
  const hasPod =
    options.podReplicas !== undefined || options.podType !== undefined;
  const hasServerless = options.readCapacity !== undefined;

  if (hasPod && hasServerless) {
    throw new PineconeArgumentError(
      'Cannot configure both serverless (readCapacity) and pod (podReplicas/podType)index values.',
    );
  }

  if (hasPod) {
    return {
      pod: {
        replicas: options.podReplicas,
        podType: options.podType,
      },
    };
  }

  if (hasServerless) {
    return {
      serverless: {
        readCapacity: toApiReadCapacity(options.readCapacity),
      },
    };
  }

  return undefined;
};
