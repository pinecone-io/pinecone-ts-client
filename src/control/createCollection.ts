import {
  CollectionModel,
  CreateCollectionRequest,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/control';
import { buildConfigValidator } from '../validator';
// import { CollectionNameSchema, IndexNameSchema } from './types';
import { Type } from '@sinclair/typebox';
import { PineconeArgumentError } from '../errors';

// const CreateCollectionOptionsSchema = Type.Object(
//   {
//     name: CollectionNameSchema,
//     source: IndexNameSchema,
//   },
//   { additionalProperties: false }
// );

export const createCollection = (api: ManageIndexesApi) => {
  // const validator = buildConfigValidator(
  //   CreateCollectionOptionsSchema,
  //   'createCollection'
  // );

  const validator = async (options: CreateCollectionRequest) => {
    if (!options || typeof options !== 'object') {
      throw new PineconeArgumentError(
        'You must pass a non-empty object with `name` and `source` fields in order to create a collection.'
      );
    }
    if (!options.name && !options.source) {
      throw new PineconeArgumentError(
        'The argument to createCollection must have required properties: name, source.'
      );
    }
    if (!options.name || options.name.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create a collection.'
      );
    }
    if (!options.source || options.source.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `source` in order to create a collection.'
      );
    }
  };

  return async (options: CreateCollectionRequest): Promise<CollectionModel> => {
    await validator(options);
    return await api.createCollection({ createCollectionRequest: options });
  };
};
