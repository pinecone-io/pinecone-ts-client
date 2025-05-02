import { ListNamespacesResponse } from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';

export const listNamespaces = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    limit?: number,
    paginationToken?: string
  ): Promise<ListNamespacesResponse> => {
    const api = await apiProvider.provide();
    return await api.listNamespaces({ limit, paginationToken });
  };
};
