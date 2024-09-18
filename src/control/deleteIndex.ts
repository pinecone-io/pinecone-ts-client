import { ManageIndexesApi } from '../pinecone-generated-ts-fetch/db_control';
import { IndexName } from './types';
import { PineconeArgumentError } from '../errors';

/** The name of index to delete */
export type DeleteIndexOptions = IndexName;

export const deleteIndex = (api: ManageIndexesApi) => {
  return async (indexName: DeleteIndexOptions): Promise<void> => {
    if (!indexName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `indexName` in order to delete an index'
      );
    }
    await api.deleteIndex({ indexName });
    return;
  };
};
