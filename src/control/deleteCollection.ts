import {
  DeleteCollectionRequest,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/db_control';
import type { CollectionName } from './types';
import { PineconeArgumentError } from '../errors';
import { withControlApiVersion } from './apiVersion';

/**
 * The name of collection to delete.
 */
export type DeleteCollectionOptions = CollectionName;

export const deleteCollection = (api: ManageIndexesApi) => {
  return async (collectionName: DeleteCollectionOptions): Promise<void> => {
    if (!collectionName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `collectionName`'
      );
    }
    await api.deleteCollection(
      withControlApiVersion<DeleteCollectionRequest>({ collectionName })
    );
    return;
  };
};
