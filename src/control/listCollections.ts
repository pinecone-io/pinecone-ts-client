import {
  ManageIndexesApi,
  CollectionList,
} from '../pinecone-generated-ts-fetch/control';

export const listCollections = (api: ManageIndexesApi) => {
  return async (): Promise<CollectionList> => {
    const results = await api.listCollections();

    return results;
  };
};
