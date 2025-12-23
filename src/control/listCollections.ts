import {
  ManageIndexesApi,
  CollectionList,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';

export const listCollections = (api: ManageIndexesApi) => {
  return async (): Promise<CollectionList> => {
    const results = await api.listCollections({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });

    return results;
  };
};
