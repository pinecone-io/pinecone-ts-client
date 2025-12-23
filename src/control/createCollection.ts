import {
  CollectionModel,
  CreateCollectionRequest,
  ManageIndexesApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../errors';
import { ValidateObjectProperties } from '../utils/validateObjectProperties';

// Properties for validation to ensure no unknown/invalid properties are passed
type CreateCollectionRequestType = keyof CreateCollectionRequest;
export const CreateCollectionRequestProperties: CreateCollectionRequestType[] =
  ['source', 'name'];

export const createCollection = (api: ManageIndexesApi) => {
  const validator = (options: CreateCollectionRequest) => {
    if (options) {
      ValidateObjectProperties(options, CreateCollectionRequestProperties);
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
    return await api.createCollection({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createCollectionRequest: options,
    });
  };
};
