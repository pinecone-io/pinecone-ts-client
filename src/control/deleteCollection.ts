import { ManageIndexesApi } from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';
// import { buildConfigValidator } from '../validator';
// import { CollectionNameSchema } from './types';
// import type { CollectionName } from './types';

/**
 * The name of collection to delete.
 */
// export type DeleteCollectionOptions = CollectionName;

export const deleteCollection = (api: ManageIndexesApi) => {
  // const validator = buildConfigValidator(
  //   CollectionNameSchema,
  //   'deleteCollection'
  // );

  return async (collectionName: string): Promise<void> => {
    if (
      !collectionName ||
      collectionName.length === 0 ||
      typeof collectionName !== 'string'
    ) {
      throw new PineconeArgumentError(
        'You must enter a non-empty string for the `collectionName` field.'
      );
    }
    // validator(collectionName);

    await api.deleteCollection({ collectionName });
    return;
  };
};
