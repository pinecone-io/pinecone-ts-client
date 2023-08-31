import { Static, Type } from '@sinclair/typebox';
import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { handleCollectionRequestError } from './utils';
import type { CollectionMeta as CollectionDescription } from '../pinecone-generated-ts-fetch';

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
      const err = await handleCollectionRequestError(e, api, name);
      throw err;
    }
  };
};
