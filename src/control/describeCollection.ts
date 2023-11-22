import {
  ManagePodIndexesApi,
  CollectionModel,
} from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';

export const describeCollection = (api: ManagePodIndexesApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
    'describeCollection'
  );

  return async (name: CollectionName): Promise<CollectionModel> => {
    validator(name);

    return await api.describeCollection({ collectionName: name });
  };
};
