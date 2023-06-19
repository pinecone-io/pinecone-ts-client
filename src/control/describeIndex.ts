import { Static, Type } from '@sinclair/typebox';
import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { builOptionConfigValidator } from '../validator';
import { mapHttpStatusError } from '../errors';
import { validIndexMessage } from './utils';
import type {
  ResponseError,
  IndexMeta as IndexDescription,
} from '../pinecone-generated-ts-fetch';

// If user passes the empty string for index name, the generated
// OpenAPI client will call /databases/ which is the list
// indexes endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an index named empty
// string. To avoid this confusing case, we require lenth > 1.
const DescribeIndexOptionsSchema = Type.String({ minLength: 1 });

export type IndexName = Static<typeof DescribeIndexOptionsSchema>;

export const describeIndex = (api: IndexOperationsApi) => {
  const validator = builOptionConfigValidator(
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
      const describeError = e as ResponseError;
      const requestInfo = {
        status: describeError.response.status,
      };

      let toThrow;
      if (requestInfo.status === 404) {
        const message = await validIndexMessage(api, name, requestInfo);
        toThrow = mapHttpStatusError({ ...requestInfo, message });
      } else {
        // 500? 401? This logical branch is not generally expected. Let
        // the http error mapper handle it, but we can't write a
        // message because we don't know what went wrong.
        toThrow = mapHttpStatusError(requestInfo);
      }
      throw toThrow;
    }
  };
};
