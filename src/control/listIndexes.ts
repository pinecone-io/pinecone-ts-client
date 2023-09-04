import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

export type IndexNameObj = {
  name: string;
};
export type IndexList = Array<IndexNameObj>;

export const listIndexes = (api: IndexOperationsApi) => {
  return async (): Promise<IndexList> => {
    try {
      const names = await api.listIndexes();

      // We know in a future version of the API that listing
      // indexes should return more information than just the
      // index names. Mapping these results into an object
      // will allow us us to add more information in the future
      // in a non-breaking way.
      return names.map((n) => ({ name: n }));
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
