import { ManagePodIndexesApi, IndexList } from '../pinecone-generated-ts-fetch';

/**
 * A description of indexes in your project.
 *
 * For full information about each index, see { @link Pinecone.describeIndex }
 */
// export type IndexListDescription = {
//   /** The name of the index */
//   name: string;

//   /** The distance metric of the index */
//   metric: string;

//   /** The dimension of the index */
//   dimension: number;

//   /** The capacityMode of the index */
//   capacityMode: string;

//   /** The host address of the index */
//   host: string;
// };

// /** The list of indexes in your project */
// export type IndexList = Array<IndexListDescription>;

export const listIndexes = (api: ManagePodIndexesApi) => {
  return async (): Promise<IndexList> => {
    const response = await api.listIndexes();

    return response;
  };
};
