import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

type IndexName = string;
export type IndexList = IndexName[];

export const listIndexes = (api: IndexOperationsApi) => {
  return async (): Promise<IndexList> => {
    try {
      return await api.listIndexes();
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
