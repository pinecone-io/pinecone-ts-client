import {
  ManageIndexesApi,
  CollectionModel,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import type { CollectionName } from './types';
import { PineconeArgumentError } from '../errors';

/**
 * The name of collection to describe.
 */
export type DescribeCollectionOptions = CollectionName;

export const describeCollection = (api: ManageIndexesApi) => {
  return async (name: DescribeCollectionOptions): Promise<CollectionModel> => {
    if (!name || name.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to describe a collection',
      );
    }

    return await api.describeCollection({
      collectionName: name,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
