import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { handleCollectionRequestError } from './utils';
import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';

export type DeleteCollectionOptions = CollectionName;

export const deleteCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
    'deleteCollection'
  );

  return async (collectionName: CollectionName): Promise<void> => {
    validator(collectionName);

    try {
      await api.deleteCollection({ collectionName: collectionName });
      return;
    } catch (e) {
      const err = await handleCollectionRequestError(e, api, collectionName);
      throw err;
    }
  };
};
