import { DataOperationsProvider } from './dataOperationsProvider';
import type {
  ListRequest,
  ListResponse,
} from '../pinecone-generated-ts-fetch/data';

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

export const listPaginated = (
  apiProvider: DataOperationsProvider,
  namespace: string
) => {
  const validator = async (options: ListOptions) => {
    // Don't need to check for empty string prefix or paginationToken, since empty strings evaluate to false
    if (options.limit && options.limit < 0) {
      throw new Error('Limit must be greater than 0');
    }
  };

  return async (options?: ListOptions): Promise<ListResponse> => {
    if (options) {
      await validator(options);
    }

    const listRequest: ListRequest = {
      ...options,
      namespace,
    };

    const api = await apiProvider.provide();
    return await api.list(listRequest);
  };
};
