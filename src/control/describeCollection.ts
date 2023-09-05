import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { handleCollectionRequestError } from './utils';
import type { CollectionMeta } from '../pinecone-generated-ts-fetch';
import { CollectionNameSchema, type CollectionName } from './types';

export type DescribeCollectionOptions = CollectionName;
export type CollectionDescription = CollectionMeta;

export const describeCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
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
