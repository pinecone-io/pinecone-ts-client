import { ManagePodIndexesApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { IndexName, IndexNameSchema } from './types';

/** The name of index to delete */
export type DeleteIndexOptions = IndexName;

export const deleteIndex = (api: ManagePodIndexesApi) => {
  const validator = buildConfigValidator(IndexNameSchema, 'deleteIndex');

  return async (indexName: DeleteIndexOptions): Promise<void> => {
    // TODO: Fix runtime validation
    validator(indexName);

    await api.deleteIndex({ indexName: indexName });
    return;
  };
};
