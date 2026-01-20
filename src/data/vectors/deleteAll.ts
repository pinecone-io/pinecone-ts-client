import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { RetryOnServerFailure } from '../../utils';

export const deleteAll = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  return async (maxRetries?: number): Promise<void> => {
    const api = await apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.deleteVectors.bind(api),
      maxRetries
    );
    await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      deleteRequest: { deleteAll: true, namespace },
    });
    return;
  };
};
