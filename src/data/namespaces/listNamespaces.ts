import {
  ListNamespacesResponse,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';

export const listNamespaces = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    limit?: number,
    paginationToken?: string,
    prefix?: string
  ): Promise<ListNamespacesResponse> => {
    const api = await apiProvider.provide();
    return await api.listNamespacesOperation({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit,
      paginationToken,
      prefix,
    });
  };
};
