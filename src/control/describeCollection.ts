import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { CollectionNameSchema } from './types';
import type { CollectionName } from './types';

/**
 * The name of the collection to describe.
 */
export type DescribeCollectionOptions = CollectionName;

/**
 * A description of a Pinecone collection
 *
 * @see [Understanding collections](https://docs.pinecone.io/docs/collections#limitations)
 */
export type CollectionDescription = {
  /** The name of the collection */
  name?: string;

  /** The amount of disk, in bytes, used to store the collection. */
  size?: number;

  /** A string indicating the status of a collection and whether it is ready to be used. */
  status?: string;

  /** The dimension of records stored in the collection */
  dimension?: number;

  /** The total number of records stored in the collection */
  recordCount?: number;
};

export const describeCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CollectionNameSchema,
    'describeCollection'
  );

  return async (name: CollectionName): Promise<CollectionDescription> => {
    validator(name);

    const result = await api.describeCollection({ collectionName: name });

    // Alias vectorCount to recordCount
    return {
      name: result.name,
      size: result.size,
      status: result.status,
      dimension: result.dimension,
      recordCount: result.vectorCount,
    };
  };
};
