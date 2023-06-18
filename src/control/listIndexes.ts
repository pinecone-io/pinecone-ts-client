import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import type { ResponseError } from '../pinecone-generated-ts-fetch';

type IndexName = string;
export type IndexList = IndexName[];

export const listIndexes = (api: IndexOperationsApi) => {
  return async (): Promise<IndexList> => {
    try {
      return await api.listIndexes();
    } catch (e) {
      const listIndexesError = e as ResponseError;
      throw mapHttpStatusError({
        status: listIndexesError.response.status,
        url: listIndexesError.response.url,
      });
    }
  };
};
