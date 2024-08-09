import {
  ManageIndexesApi,
  CollectionModel,
} from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';

export const describeCollection = (api: ManageIndexesApi) => {
  return async (name: string): Promise<CollectionModel> => {
    if (!name || name.length === 0 || typeof name !== 'string') {
      throw new PineconeArgumentError(
        'You must enter a non-empty string for the `collectionName` field.'
      );
    }

    return await api.describeCollection({ collectionName: name });
  };
};
