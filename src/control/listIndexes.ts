import {
  ManageIndexesApi,
  IndexList,
} from '../pinecone-generated-ts-fetch/control';

export const listIndexes = (api: ManageIndexesApi) => {
  return async (): Promise<IndexList> => {
    const response = await api.listIndexes();

    return response;
  };
};
