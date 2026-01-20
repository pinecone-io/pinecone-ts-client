import {
  ListNamespacesResponse,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';
import { RetryOnServerFailure } from '../../utils';

export const listNamespaces = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    limit?: number,
    paginationToken?: string,
    prefix?: string,
    maxRetries?: number
  ): Promise<ListNamespacesResponse> => {
    const api = await apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.listNamespacesOperation.bind(api),
      maxRetries
    );
    return await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit,
      paginationToken,
      prefix,
    });
  };
};
