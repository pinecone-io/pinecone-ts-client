import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';

export const deleteNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (namespace: string): Promise<void> => {
    const api = await apiProvider.provide();
    await api.deleteNamespace({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      namespace,
    });
    return;
  };
};
