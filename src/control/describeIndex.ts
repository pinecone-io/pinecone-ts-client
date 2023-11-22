import { ManagePodIndexesApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { IndexModel } from '../pinecone-generated-ts-fetch';
import { IndexNameSchema } from './types';
import type { IndexName } from './types';

/** The name of the index to describe */
export type DescribeIndexOptions = IndexName;

export const describeIndex = (api: ManagePodIndexesApi) => {
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

  return async (name: DescribeIndexOptions): Promise<IndexModel> => {
    validator(name);

    const result = await api.describeIndex({ indexName: name });
    removeDeprecatedFields(result);

    return result;
  };
};
