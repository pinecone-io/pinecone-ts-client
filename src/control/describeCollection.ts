import {
  ManageIndexesApi,
  CollectionModel,
} from '../pinecone-generated-ts-fetch/control';
import { buildConfigValidator } from '../validator';
// import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';
import { PineconeArgumentError } from '../errors';

/**
 * The name of collection to describe.
 */
export type DescribeCollectionOptions = CollectionName;

export const describeCollection = (api: ManageIndexesApi) => {
  // const validator = buildConfigValidator(
  //   CollectionNameSchema,
  //   'describeCollection'
  // );

  return async (name: DescribeCollectionOptions): Promise<CollectionModel> => {
    if (!name || name.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to describe a collection'
      );
    }

    return await api.describeCollection({ collectionName: name });
  };
};
