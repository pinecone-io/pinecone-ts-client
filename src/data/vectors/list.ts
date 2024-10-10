import { VectorOperationsProvider } from './vectorOperationsProvider';
import type {
  ListVectorsRequest,
  ListResponse,
} from '../../pinecone-generated-ts-fetch/db_data';
import { ValidateProperties } from '../../utils/validateProperties';

/**
 * See [List record IDs](https://docs.pinecone.io/guides/data/list-record-ids)
 */
export type ListOptions = {
  /** The id prefix to match. If unspecified, an empty string prefix will be used with the effect of listing all ids in a namespace. */
  prefix?: string;
  /** The maximum number of ids to return. If unspecified, the server will use a default value. */
  limit?: number;
  /** A token needed to fetch the next page of results. This token is returned in the response if additional results are available. */
  paginationToken?: string;
};

// Properties for validation to ensure no unknown/invalid properties are passed, no req'd properties are missing
type ListOptionsType = keyof ListOptions;
const ListOptionsProperties: ListOptionsType[] = [
  'prefix',
  'limit',
  'paginationToken',
];

export const listPaginated = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = (options: ListOptions) => {
    if (options) {
      ValidateProperties(options, ListOptionsProperties);
    }
    // Don't need to check for empty string prefix or paginationToken, since empty strings evaluate to false
    if (options.limit && options.limit < 0) {
      throw new Error('`limit` property must be greater than 0');
    }
  };

  return async (options?: ListOptions): Promise<ListResponse> => {
    if (options) {
      validator(options);
    }

    const listVectorsRequest: ListVectorsRequest = {
      ...options,
      namespace,
    };

    const api = await apiProvider.provide();
    return await api.listVectors(listVectorsRequest);
  };
};
