import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { handleIndexRequestError } from './utils';
import { CollectionNameSchema, IndexNameSchema } from './types';
import type { CollectionName, IndexName } from './types';
import { Type } from '@sinclair/typebox';

const CreateCollectionOptionsSchema = Type.Object(
  {
    name: CollectionNameSchema,
    source: IndexNameSchema,
  },
  { additionalProperties: false }
);

export type CreateCollectionOptions = {
  name: CollectionName;
  source: IndexName;
};

export const createCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CreateCollectionOptionsSchema,
    'createCollection'
  );

  return async (options: CreateCollectionOptions): Promise<void> => {
    validator(options);

    try {
      await api.createCollection({ createCollectionRequest: options });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, options.source);
      throw err;
    }
  };
};
