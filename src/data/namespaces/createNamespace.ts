import {
  NamespaceDescription,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import type { MetadataSchema } from '../../pinecone-generated-ts-fetch/db_control';
import { NamespaceOperationsProvider } from './namespacesOperationsProvider';

export interface CreateNamespaceOptions {
  name: string;
  schema?: MetadataSchema;
}

export const createNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    request: CreateNamespaceOptions
  ): Promise<NamespaceDescription> => {
    const api = await apiProvider.provide();
    return await api.createNamespace({
      createNamespaceRequest: request,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
