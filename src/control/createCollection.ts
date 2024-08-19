import {
  CollectionModel,
  CreateCollectionRequest,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';
import {
  CreateCollectionRequestProperties,
  ValidateProperties,
} from '../utils/validateProperties';

export const createCollection = (api: ManageIndexesApi) => {
  const validator = (options: CreateCollectionRequest) => {
    if (options) {
      ValidateProperties(options, CreateCollectionRequestProperties);
    }
    if (!options || typeof options !== 'object') {
      throw new PineconeArgumentError(
        'You must pass a non-empty object with `name` and `source` fields in order to create a collection.'
      );
    }
    if (!options.name && !options.source) {
      throw new PineconeArgumentError(
        'The argument to createCollection must have required properties: `name`, `source`.'
      );
    }
    if (!options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create a collection.'
      );
    }
    if (!options.source) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `source` in order to create a collection.'
      );
    }
  };

  return async (options: CreateCollectionRequest): Promise<CollectionModel> => {
    validator(options);
    return await api.createCollection({ createCollectionRequest: options });
  };
};
