import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import type { IndexMeta } from '../pinecone-generated-ts-fetch';
import { IndexNameSchema } from './types';
import type { IndexName } from './types';

/** The name of the index to describe */
export type DescribeIndexOptions = IndexName;
/** The description of your index returned from { @link Pinecone.describeIndex } */
export type IndexDescription = IndexMeta;

export const describeIndex = (
  api: IndexOperationsApi,
  callback?: (
    descriptionResponse: IndexDescription,
    indexName: IndexName
  ) => void
) => {
  const validator = buildConfigValidator(IndexNameSchema, 'describeIndex');

  const removeDeprecatedFields = (result: any) => {
    if (result.database) {
      for (const key of Object.keys(result.database)) {
        if (result.database[key] === undefined) {
          delete result.database[key];
        }
      }
    }
  };

  return async (name: IndexName): Promise<IndexDescription> => {
    validator(name);

    const result = await api.describeIndex({ indexName: name });
    removeDeprecatedFields(result);

    if (callback) {
      callback(result, name);
    }

    return result;
  };
};
