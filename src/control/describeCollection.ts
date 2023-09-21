import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { handleCollectionRequestError } from './utils';
import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';

export type DescribeCollectionOptions = CollectionName;
export type CollectionDescription = {
  name?: string;
  size?: number;
  status?: string;
  dimension?: number;
  recordCount?: number;
};

export const describeCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
    'describeCollection'
  );

  return async (name: CollectionName): Promise<CollectionDescription> => {
    validator(name);

    try {
      const result = await api.describeCollection({ collectionName: name });

      // Alias vectorCount to recordCount
      return {
        name: result.name,
        size: result.size,
        status: result.status,
        dimension: result.dimension,
        recordCount: result.vectorCount,
      };
    } catch (e) {
      const err = await handleCollectionRequestError(e, api, name);
      throw err;
    }
  };
};
