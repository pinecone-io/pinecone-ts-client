import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import type { ResponseError } from '../pinecone-generated-ts-fetch';

export type CollectionName = string;
export type CollectionList = CollectionName[];

export const listCollections = (api: IndexOperationsApi) => {
  return async (): Promise<CollectionList> => {
    try {
      return await api.listCollections();
    } catch (e) {
      const listCollectionsError = e as ResponseError;
      throw mapHttpStatusError({
        status: listCollectionsError.response.status,
        url: listCollectionsError.response.url,
        message: await listCollectionsError.response.text(),
      });
    }
  };
};
