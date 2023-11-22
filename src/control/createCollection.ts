import {
  ManagePodIndexesApi,
  CreateCollectionRequest,
} from '../pinecone-generated-ts-fetch';
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

export const createCollection = (api: ManagePodIndexesApi) => {
  const validator = buildConfigValidator(
    CreateCollectionOptionsSchema,
    'createCollection'
  );

  return async (options: CreateCollectionRequest): Promise<void> => {
    validator(options);

    await api.createCollection({ createCollectionRequest: options });
    return;
  };
};
