import {
  ManageIndexesApi,
  CollectionList,
  ListCollectionsRequest,
} from '../pinecone-generated-ts-fetch/db_control';
import { withControlApiVersion } from './apiVersion';

export const listCollections = (api: ManageIndexesApi) => {
  return async (): Promise<CollectionList> => {
    const results = await api.listCollections(
      withControlApiVersion<ListCollectionsRequest>({})
    );

    return results;
  };
};
