import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { handleCollectionRequestError } from './utils';

const DeleteCollectionIndex = Type.String({ minLength: 1 });
export type CollectionName = Static<typeof DeleteCollectionIndex>;

export const deleteCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    DeleteCollectionIndex,
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
