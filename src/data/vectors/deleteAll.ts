import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';

export const deleteAll = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  return async (): Promise<void> => {
    const api = await apiProvider.provide();
    await api.deleteVectors({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      deleteRequest: { deleteAll: true, namespace },
    });
    return;
  };
};
