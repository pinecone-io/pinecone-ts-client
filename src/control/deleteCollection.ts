import { ManagePodIndexesApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';

/**
 * The name of collection to delete.
 */
export type DeleteCollectionOptions = CollectionName;

export const deleteCollection = (api: ManagePodIndexesApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
    'deleteCollection'
  );

  return async (collectionName: DeleteCollectionOptions): Promise<void> => {
    validator(collectionName);

    await api.deleteCollection({ collectionName });
    return;
  };
};
