import { ListNamespacesResponse } from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';

export const listNamespaces = (apiProvider: NamespaceOperationsProvider) => {
  return async (): Promise<ListNamespacesResponse> => {
    const api = await apiProvider.provide();
    return await api.listNamespaces();
  };
};
