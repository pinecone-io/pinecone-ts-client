import { NamespaceOperationsProvider } from '../namespaces/namespacesOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { RetryOnServerFailure } from '../../utils';

export const deleteNamespace = (apiProvider: NamespaceOperationsProvider) => {
  return async (namespace: string, maxRetries?: number): Promise<void> => {
    const api = await apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.deleteNamespace.bind(api),
      maxRetries
    );
    await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      namespace,
    });
    return;
  };
};
