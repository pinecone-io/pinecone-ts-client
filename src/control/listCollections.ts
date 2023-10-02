import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

/**
 * A partial description of a collection in your project.
 *
 * To see full information about the collection, see { @link Pinecone.describeCollection }
 */
export type PartialCollectionDescription = {
  /** The name of the collection */
  name: string;
};

/**
 * A list of collections in your project
 *
 * @see [Understanding collections](https://docs.pinecone.io/docs/collections#limitations)
 */
export type CollectionList = PartialCollectionDescription[];

export const listCollections = (api: IndexOperationsApi) => {
  return async (): Promise<CollectionList> => {
    try {
      const results = await api.listCollections();

      // We know in a future version of the API that listing
      // collections should return more information than just the
      // collection names. Mapping these results into an object
      // will allow us us to add more information in the future
      // in a non-breaking way.
      return results.map((c) => ({ name: c }));
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
