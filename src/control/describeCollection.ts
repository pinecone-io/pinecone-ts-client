import { Static, Type } from '@sinclair/typebox';
import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { mapHttpStatusError } from '../errors';
import { validCollectionMessage } from './utils';
import type {
  ResponseError,
  CollectionMeta as CollectionDescription,
} from '../pinecone-generated-ts-fetch';

// If user passes the empty string for collection name, the generated
// OpenAPI client will call /databases/ which is the list
// collection endpoint. This returns 200 instead of 404, but obviously
// no descriptive information is returned for an collection named empty
// string. To avoid this confusing case, we require lenth > 1.
const DescribeCollectionSchema = Type.String({ minLength: 1 });

export type CollectionName = Static<typeof DescribeCollectionSchema>;

export const describeCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    DescribeCollectionSchema,
    'describeCollection'
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

  return async (name: CollectionName): Promise<CollectionDescription> => {
    validator(name);

    try {
      const result = await api.describeCollection({ collectionName: name });
      removeDeprecatedFields(result);
      return result;
    } catch (e) {
      const describeError = e as ResponseError;
      const requestInfo = {
        status: describeError.response.status,
      };

      let toThrow;
      if (requestInfo.status === 404) {
        const message = await validCollectionMessage(api, name, requestInfo);
        toThrow = mapHttpStatusError({ ...requestInfo, message });
      } else {
        toThrow = mapHttpStatusError(requestInfo);
      }
      throw toThrow;
    }
  };
};
