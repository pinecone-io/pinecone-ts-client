import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';

export const deleteNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (namespace: string): Promise<void> => {
    const api = await apiProvider.provide();
    await api.deleteNamespace({ namespace });
    return;
  };
};
