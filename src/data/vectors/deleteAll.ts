import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';

/**
 * Options for deleting all records from a namespace.
 *
 * @see {@link Index.deleteAll }
 */
export type DeleteAllOptions = {
  /**
   * The namespace to delete all records from. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
};

export const deleteAll = (
  apiProvider: VectorOperationsProvider,
  targetNamespace: string,
) => {
  return async (options?: DeleteAllOptions): Promise<void> => {
    const namespace = options?.namespace ?? targetNamespace;
    const api = await apiProvider.provide();
    await api.deleteVectors({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      deleteRequest: { deleteAll: true, namespace },
    });
    return;
  };
};
