import {
  CreateIndexRequestMetricEnum,
  CreateIndexForModelRequest,
  IndexModel,
  IndexModelMetricEnum,
  ManageIndexesApi,
  DeletionProtection,
  ServerlessSpecCloudEnum,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import { waitUntilIndexIsReady } from './createIndex';
import { ValidateObjectProperties } from '../utils/validateObjectProperties';

export type CreateIndexForModelOptions = {
  name: string;
  cloud: ServerlessSpecCloudEnum;
  region: string;
  embed: CreateIndexForModelEmbed;

  deletionProtection?: DeletionProtection;
  tags?: { [key: string]: string };

  /** This option tells the client not to resolve the returned promise until the index is ready to receive data. */
  waitUntilReady?: boolean;

  /** This option tells the client not to throw if you attempt to create an index that already exists. */
  suppressConflicts?: boolean;
};

// Properties for validation to ensure no unknown properties are passed
type CreateIndexForModelOptionsType = keyof CreateIndexForModelOptions;
const CreateIndexForModelOptionsProperties: CreateIndexForModelOptionsType[] = [
  'name',
  'cloud',
  'region',
  'embed',
  'deletionProtection',
  'tags',
  'waitUntilReady',
  'suppressConflicts',
];

export type CreateIndexForModelEmbed = {
  model: string;
  metric?: CreateIndexRequestMetricEnum;
  fieldMap?: object;
  readParameters?: object;
  writeParameters?: object;
};

// Properties for validation to ensure no unknown properties are passed
type CreateIndexForModelEmbedType = keyof CreateIndexForModelEmbed;
const CreateIndexForModelEmbedProperties: CreateIndexForModelEmbedType[] = [
  'model',
  'metric',
  'fieldMap',
  'readParameters',
  'writeParameters',
];

export const createIndexForModel = (api: ManageIndexesApi) => {
  return async (
    options: CreateIndexForModelOptions
  ): Promise<IndexModel | void> => {
    if (!options) {
      throw new PineconeArgumentError(
        'You must pass an object with required properties (`name`, `cloud`, `region`, and an `embed`)'
      );
    }

    validateCreateIndexForModelRequest(options);
    try {
      const createResponse = await api.createIndexForModel({
        createIndexForModelRequest: options as CreateIndexForModelRequest,
      });
      if (options.waitUntilReady) {
        return await waitUntilIndexIsReady(api, createResponse.name);
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

const validateCreateIndexForModelRequest = (
  options: CreateIndexForModelOptions
) => {
  // validate options properties
  if (options) {
    ValidateObjectProperties(options, CreateIndexForModelOptionsProperties);
  }

  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create an index.'
    );
  }
  if (!options.cloud) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `cloud` in order to create an index.'
    );
  }
  if (
    options.cloud &&
    !Object.values(ServerlessSpecCloudEnum).includes(options.cloud)
  ) {
    throw new PineconeArgumentError(
      `Invalid cloud value: ${options.cloud}. Valid values are: ${Object.values(
        ServerlessSpecCloudEnum
      ).join(', ')}.`
    );
  }

  if (!options.region) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `region` in order to create an index.'
    );
  }
  if (!options.embed) {
    throw new PineconeArgumentError(
      'You must pass an `embed` object in order to create an index.'
    );
  }

  // validate embed properties
  if (options.embed) {
    ValidateObjectProperties(options.embed, CreateIndexForModelEmbedProperties);
  }
  if (
    options.embed.metric &&
    !Object.values(IndexModelMetricEnum).includes(options.embed.metric)
  ) {
    {
      throw new PineconeArgumentError(
        `Invalid metric value: ${
          options.embed.metric
        }. Valid values are: ${Object.values(IndexModelMetricEnum).join(', ')}.`
      );
    }
  }
};
