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
import { ValidateObjectProperties } from '../utils/validateObjectProperties';
import { RetryOnServerFailure } from '../utils';
import {
  CreateIndexReadCapacity,
  toApiReadCapacity,
  validateReadCapacity,
} from './createIndex';

export type ConfigureIndexOptions = {
  deletionProtection?: string;
  tags?: { [key: string]: string };
  embed?: ConfigureIndexRequestEmbed;
  podReplicas?: number;
  podType?: string;
  readCapacity?: CreateIndexReadCapacity;
};

// Properties for validation to ensure no unknown/invalid properties are passed
type ConfigureIndexOptionsType = keyof ConfigureIndexOptions;
export const ConfigureIndexOptionsProperties: ConfigureIndexOptionsType[] = [
  'deletionProtection',
  'tags',
  'embed',
  'podReplicas',
  'podType',
  'readCapacity',
];

export const configureIndex = (api: ManageIndexesApi) => {
  const validator = (indexName: IndexName, options: ConfigureIndexOptions) => {
    if (options) {
      ValidateObjectProperties(options, ConfigureIndexOptionsProperties);
    }

    if (!indexName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `indexName` to configureIndex.'
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
        'You must pass at least one configuration option to configureIndex.'
      );
    }

    if (options.readCapacity) {
      validateReadCapacity(options.readCapacity);
    }
  };

  return async (
    indexName: IndexName,
    options: ConfigureIndexOptions,
    maxRetries?: number
  ): Promise<IndexModel> => {
    validator(indexName, options);

    const retryWrapper = new RetryOnServerFailure(
      api.configureIndex.bind(api),
      maxRetries
    );

    const spec = buildConfigureSpec(options);
    const request: ConfigureIndexRequest = {
      deletionProtection: options.deletionProtection,
      tags: options.tags,
      embed: options.embed,
      spec,
    };

    return await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      indexName,
      configureIndexRequest: request,
    });
  };
};

const buildConfigureSpec = (
  options: ConfigureIndexOptions
): ConfigureIndexRequestSpec | undefined => {
  const hasPod =
    options.podReplicas !== undefined || options.podType !== undefined;
  const hasServerless = options.readCapacity !== undefined;

  if (hasPod && hasServerless) {
    throw new PineconeArgumentError(
      'Cannot configure both serverless (readCapacity) and pod (podReplicas/podType)index values.'
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
