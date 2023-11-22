import {
  ManagePodIndexesApi,
  CollectionList,
} from '../pinecone-generated-ts-fetch';

export const listCollections = (api: ManagePodIndexesApi) => {
  return async (): Promise<CollectionList> => {
    const results = await api.listCollections();

    return results;
  };
};
