import {
  CreateIndexRequestMetricEnum,
  CreateIndexForModelRequest,
  IndexModel,
  ManageIndexesApi,
  DeletionProtection,
  ServerlessSpecCloudEnum,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import { waitUntilIndexIsReady } from './createIndex';

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

export type CreateIndexForModelEmbed = {
  model: string;
  metric?: CreateIndexRequestMetricEnum;
  fieldMap?: object;
  readParameters?: object;
  writeParameters?: object;
};

export const createIndexForModel = (api: ManageIndexesApi) => {
  return async (
    options: CreateIndexForModelOptions
  ): Promise<IndexModel | void> => {
    if (!options) {
      throw new PineconeArgumentError(
        'You must pass an object with required properties (`name`, `cloud`, `region`, and an `embed`)'
      );
    }

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
