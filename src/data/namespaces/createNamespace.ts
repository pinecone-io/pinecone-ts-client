import {
  NamespaceDescription,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import type { CreateNamespaceRequestSchema } from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from './namespacesOperationsProvider';
import { PineconeArgumentError } from '../../errors';

/** Options for creating a namespace. */
export interface CreateNamespaceOptions {
  /** The name of the namespace to create. */
  name: string;
  /**
   * Metadata fields to make filterable, such as `{ fields: { category: { filterable: true } } }`.
   * Omit to index all metadata fields; when supplied, only listed filterable fields are indexed.
   */
  schema?: CreateNamespaceRequestSchema;
}

export const createNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    options: CreateNamespaceOptions,
  ): Promise<NamespaceDescription> => {
    const api = await apiProvider.provide();

    if (!options || !options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create a namespace.',
      );
    }

    return await api.createNamespace({
      createNamespaceRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
