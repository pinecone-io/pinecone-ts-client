import {
  NamespaceDescription,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';
import { RetryOnServerFailure } from '../../utils';

export const describeNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (
    namespace: string,
    maxRetries?: number
  ): Promise<NamespaceDescription> => {
    const api = await apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.describeNamespace.bind(api),
      maxRetries
    );
    return await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      namespace,
    });
  };
};
