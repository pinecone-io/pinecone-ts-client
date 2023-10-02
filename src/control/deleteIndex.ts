import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { IndexName, IndexNameSchema } from './types';
import { handleIndexRequestError } from './utils';

/** The name of index to delete */
export type DeleteIndexOptions = IndexName;

export const deleteIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(IndexNameSchema, 'deleteIndex');

  return async (indexName: DeleteIndexOptions): Promise<void> => {
    validator(indexName);

    try {
      await api.deleteIndex({ indexName: indexName });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, indexName);
      throw err;
    }
  };
};
