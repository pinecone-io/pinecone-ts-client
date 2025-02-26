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

/**
 * Options for creating an index for a specific model.
 * @see [Create or configure an index](https://docs.pinecone.io/guides/inference/integrated-inference#2-create-or-configure-an-index)
 */
export type CreateIndexForModelOptions = {
  /**
   * The name of the index. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
   */
  name: string;
  /**
   * The public cloud where you would like your index hosted.
   */
  cloud: ServerlessSpecCloudEnum;
  /**
   * The region where you would like your index to be created.
   */
  region: string;
  /**
   * The {@link CreateIndexForModelEmbed} object used to configure the integrated inference embedding model.
   */
  embed: CreateIndexForModelEmbed;
  /**
   * Allows configuring an index to be protected from deletion. Defaults to `disabled`.
   */
  deletionProtection?: DeletionProtection;
  /**
   * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
   */
  tags?: { [key: string]: string };
  /**
   * This option tells the client not to resolve the returned promise until the index is ready to receive data.
   */
  waitUntilReady?: boolean;
  /**
   * This option tells the client not to throw if you attempt to create an index that already exists.
   */
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

/**
 * Specifies the integrated inference embedding configuration for the index.
 * Once set the model cannot be changed, but you can later update the embedding configuration for an integrated inference index including field map, read parameters, or write parameters.
 * Refer to the [model guide](https://docs.pinecone.io/guides/inference/understanding-inference#embedding-models)
 * for available models and model details.
 */
export type CreateIndexForModelEmbed = {
  /**
   * The name of the embedding model to use for the index.
   */
  model: string;
  /**
   * The distance metric to be used for similarity search. You can use 'euclidean', 'cosine', or 'dotproduct'. If not specified, the metric
   * will be defaulted according to the model. Cannot be updated once set.
   */
  metric?: CreateIndexRequestMetricEnum;
  /**
   * Identifies the name of the text field from your document model that will be embedded.
   */
  fieldMap?: object;
  /**
   * The read parameters for the embedding model.
   */
  readParameters?: object;
  /**
   * The write parameters for the embedding model.
   */
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
