import { buildConfigValidator } from '../validator';
import {
  IndexModel,
  ManageIndexesApi,
} from '../pinecone-generated-ts-fetch/control';
// import { IndexNameSchema } from './types';
import type { IndexName } from './types';
import { PineconeArgumentError } from '../errors';

/** The name of the index to describe */
export type DescribeIndexOptions = IndexName;

export const describeIndex = (api: ManageIndexesApi) => {
  // const validator = buildConfigValidator(IndexNameSchema, 'describeIndex');

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
    if (!indexName || indexName.length === 0) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to describe an index'
      );
    }
    // validator(indexName);

    const result = await api.describeIndex({ indexName });
    removeDeprecatedFields(result);

    return result;
  };
};
