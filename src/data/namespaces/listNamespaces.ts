import {
  ListNamespacesResponse,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';

/** Options for listing namespaces in an index. */
export interface ListNamespacesOptions {
  /** (Optional) Max number of namespaces to return per page. */
  limit?: number;
  /** (Optional) Pagination token to continue a previous listing operation. */
  paginationToken?: string;
  /** (Optional) Prefix of the namespaces to list. Acts as a filter to return only namespaces that start with this prefix. */
  prefix?: string;
}

export const listNamespaces = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    options?: ListNamespacesOptions,
  ): Promise<ListNamespacesResponse> => {
    const api = await apiProvider.provide();

    return await api.listNamespacesOperation({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit: options?.limit,
      paginationToken: options?.paginationToken,
      prefix: options?.prefix,
    });
  };
};
