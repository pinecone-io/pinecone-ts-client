import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { handleIndexRequestError } from './utils';

const DescribeIndexSchema = Type.String({ minLength: 1 });
export type IndexName = Static<typeof DescribeIndexSchema>;

export const deleteIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(DescribeIndexSchema, 'deleteIndex');

  return async (indexName: IndexName): Promise<void> => {
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
