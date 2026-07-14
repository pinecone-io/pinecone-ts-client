import {
  ManageIndexesApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import type { CollectionName } from './types';
import { PineconeArgumentError } from '../errors';

/**
 * The name of collection to delete.
 */
export type DeleteCollectionOptions = CollectionName;

export const deleteCollection = (api: ManageIndexesApi) => {
  return async (collectionName: DeleteCollectionOptions): Promise<void> => {
    if (!collectionName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `collectionName`',
      );
    }

    await api.deleteCollection({
      collectionName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    return;
  };
};
