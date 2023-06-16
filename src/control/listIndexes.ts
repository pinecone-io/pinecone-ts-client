import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import type { ResponseError } from '../pinecone-generated-ts-fetch';

export const listIndexes = (api: IndexOperationsApi) => {
  return async () => {
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
