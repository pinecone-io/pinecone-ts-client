import {
  IndexModel,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/control';
import { PineconeArgumentError } from '../errors';

export const describeIndex = (api: ManageIndexesApi) => {
  const removeDeprecatedFields = (result: any) => {
    if (result.database) {
      for (const key of Object.keys(result.database)) {
        if (result.database[key] === undefined) {
          delete result.database[key];
        }
      }
    }
  };

  return async (indexName: string): Promise<IndexModel> => {
    if (!indexName || indexName.length === 0 || typeof indexName !== 'string') {
      throw new PineconeArgumentError(
        'You must enter a non-empty string for the `indexName` field.'
      );
    }

    const result = await api.describeIndex({ indexName });
    removeDeprecatedFields(result);

    return result;
  };
};
