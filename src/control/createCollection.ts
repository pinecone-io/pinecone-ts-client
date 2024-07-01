import {
  CollectionModel,
  CreateCollectionRequest,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/control';
import { buildConfigValidator } from '../validator';
import { CollectionNameSchema, IndexNameSchema } from './types';
import { Type } from '@sinclair/typebox';

const CreateCollectionOptionsSchema = Type.Object(
  {
    name: CollectionNameSchema,
    source: IndexNameSchema,
  },
  { additionalProperties: false }
);

export const createCollection = (api: ManageIndexesApi) => {
  const validator = buildConfigValidator(
    CreateCollectionOptionsSchema,
    'createCollection'
  );

  return async (options: CreateCollectionRequest): Promise<CollectionModel> => {
    validator(options);

    return await api.createCollection({ createCollectionRequest: options });
  };
};
