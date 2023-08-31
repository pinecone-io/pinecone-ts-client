import { Static, Type } from '@sinclair/typebox';
import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import type { IndexMeta as IndexDescription } from '../pinecone-generated-ts-fetch';
import { handleIndexRequestError } from './utils';

// If user passes the empty string for index name, the generated
// OpenAPI client will call /databases/ which is the list
// indexes endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an index named empty
// string. To avoid this confusing case, we require lenth > 1.
const DescribeIndexOptionsSchema = Type.String({ minLength: 1 });

export type IndexName = Static<typeof DescribeIndexOptionsSchema>;

export const describeIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    DescribeIndexOptionsSchema,
    'describeIndex'
  );

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

    try {
      const result = await api.describeIndex({ indexName: name });
      removeDeprecatedFields(result);
      return result;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, name);
      throw err;
    }
  };
};
