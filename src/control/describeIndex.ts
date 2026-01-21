import {
  IndexModel,
  ManageIndexesApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/db_control';
import type { IndexName } from './types';
import { PineconeArgumentError } from '../errors';

/** The name of the index to describe */
export type DescribeIndexOptions = IndexName;

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

  return async (indexName: DescribeIndexOptions): Promise<IndexModel> => {
    if (!indexName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to describe an index'
      );
    }

    const result = await api.describeIndex({
      indexName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    removeDeprecatedFields(result);
    return result;
  };
};
