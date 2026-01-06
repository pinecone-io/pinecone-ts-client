import {
  NamespaceDescription,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';

export const describeNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (namespace: string): Promise<NamespaceDescription> => {
    const api = await apiProvider.provide();
    return await api.describeNamespace({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      namespace,
    });
  };
};
