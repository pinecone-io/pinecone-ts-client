import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

export type CollectionName = string;
export type CollectionList = CollectionName[];

export const listCollections = (api: IndexOperationsApi) => {
  return async (): Promise<CollectionList> => {
    try {
      return await api.listCollections();
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
