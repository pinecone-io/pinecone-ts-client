import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { IndexMeta } from '../pinecone-generated-ts-fetch';

export const listIndexes = (api: IndexOperationsApi) => {
  return async (): Promise<Array<IndexMeta>> => {
    const response = await api.listIndexes();

    return response.databases || [];
  };
};
