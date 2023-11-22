import { ManagePodIndexesApi, IndexList } from '../pinecone-generated-ts-fetch';

export const listIndexes = (api: ManagePodIndexesApi) => {
  return async (): Promise<IndexList> => {
    const response = await api.listIndexes();

    return response;
  };
};
