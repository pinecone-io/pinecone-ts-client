import {
  ManageIndexesApi,
  IndexList,
  ListIndexesRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import { withControlApiVersion } from './apiVersion';

export const listIndexes = (api: ManageIndexesApi) => {
  return async (): Promise<IndexList> => {
    const response = await api.listIndexes(
      withControlApiVersion<ListIndexesRequest>({})
    );

    return response;
  };
};
