import { ManageIndexesApi } from '../pinecone-generated-ts-fetch/control';
import type { CollectionName } from './types';
import { PineconeArgumentError } from '../errors';

/**
 * The name of collection to delete.
 */
export type DeleteCollectionOptions = CollectionName;

export const deleteCollection = (api: ManageIndexesApi) => {
  return async (collectionName: DeleteCollectionOptions): Promise<void> => {
    if (!collectionName || collectionName.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `collectionName` in order to delete a' +
          ' collection'
      );
    }
    await api.deleteCollection({ collectionName });
    return;
  };
};
