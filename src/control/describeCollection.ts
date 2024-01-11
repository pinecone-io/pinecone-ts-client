import {
  ManageIndexesApi,
  CollectionModel,
} from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';

/**
 * The name of collection to describe.
 */
export type DescribeCollectionOptions = CollectionName;

export const describeCollection = (api: ManageIndexesApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
    'describeCollection'
  );

  return async (name: DescribeCollectionOptions): Promise<CollectionModel> => {
    validator(name);

    return await api.describeCollection({ collectionName: name });
  };
};
