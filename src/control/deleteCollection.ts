import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { validCollectionMessage } from './utils';

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
      const deleteError = e as ResponseError;
      const requestInfo = {
        status: deleteError.response.status,
      };

      let toThrow;
      if (requestInfo.status === 404) {
        const message = await validCollectionMessage(
          api,
          collectionName,
          requestInfo
        );
        toThrow = mapHttpStatusError({ ...requestInfo, message });
      } else {
        // 500? 401? This logical branch is not generally expected. Let
        // the http error mapper handle it, but we can't write a
        // message because we don't know what went wrong.
        toThrow = mapHttpStatusError(requestInfo);
      }
      throw toThrow;
    }
  };
};
