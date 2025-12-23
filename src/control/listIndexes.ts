import {
  ManageIndexesApi,
  IndexList,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';

export const listIndexes = (api: ManageIndexesApi) => {
  return async (): Promise<IndexList> => {
    const response = await api.listIndexes({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });

    return response;
  };
};
