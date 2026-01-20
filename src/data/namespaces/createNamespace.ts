import {
  NamespaceDescription,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import type { MetadataSchema } from '../../pinecone-generated-ts-fetch/db_control';
import { NamespaceOperationsProvider } from './namespacesOperationsProvider';
import { PineconeArgumentError } from '../../errors';

/** Options for creating a namespace. */
export interface CreateNamespaceOptions {
  /** The name of the namespace to create. */
  name: string;
  /** Schema for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when `schema` is present, only fields which are present in the `fields` object with a `filterable: true` are indexed. Note that `filterable: false` is not currently supported. */
  schema?: MetadataSchema;
}

export const createNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    options: CreateNamespaceOptions
  ): Promise<NamespaceDescription> => {
    const api = await apiProvider.provide();

    if (!options || !options.name) {
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
