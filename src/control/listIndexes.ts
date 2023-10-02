import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

/**
 * A partial description of indexes in your project.
 *
 * For full information about each index, see
 * { @link Pinecone.describeIndex }
 */
export type PartialIndexDescription = {
  /** The name of the index */
  name: string;
};

/** The list of indexes in your project */
export type IndexList = Array<PartialIndexDescription>;

export const listIndexes = (api: IndexOperationsApi) => {
  return async (): Promise<IndexList> => {
    try {
      const names = await api.listIndexes();

      // We know in a future version of the API that listing
      // indexes should return more information than just the
      // index names. Mapping these results into an object
      // will allow us us to add more information in the future
      // in a non-breaking way.
      return names.map((n) => ({ name: n }));
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
