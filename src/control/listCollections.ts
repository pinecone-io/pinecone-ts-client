import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

export type CollectionNameObj = {
  name: string;
};
export type CollectionList = CollectionNameObj[];

export const listCollections = (api: IndexOperationsApi) => {
  return async (): Promise<CollectionList> => {
    try {
      const results = await api.listCollections();

      // We know in a future version of the API that listing
      // collections should return more information than just the
      // collection names. Mapping these results into an object
      // will allow us us to add more information in the future
      // in a non-breaking way.
      return results.map((c) => ({ name: c }));
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
