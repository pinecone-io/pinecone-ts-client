import { ManageIndexesApi } from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';

export const deleteIndex = (api: ManageIndexesApi) => {
  return async (indexName: string): Promise<void> => {
    if (!indexName || indexName.length === 0 || typeof indexName !== 'string') {
      throw new PineconeArgumentError(
        'You must enter a non-empty string for the `indexName` field.'
      );
    }

    await api.deleteIndex({ indexName });
    return;
  };
};
