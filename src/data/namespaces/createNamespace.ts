import {
  NamespaceDescription,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import type { MetadataSchema } from '../../pinecone-generated-ts-fetch/db_control';
import { NamespaceOperationsProvider } from './namespacesOperationsProvider';
import { PineconeArgumentError } from '../../errors';

export interface CreateNamespaceOptions {
  name: string;
  schema?: MetadataSchema;
}

export const createNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    options: CreateNamespaceOptions
  ): Promise<NamespaceDescription> => {
    const api = await apiProvider.provide();

    if (!options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create a namespace.'
      );
    }

    return await api.createNamespace({
      createNamespaceRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
