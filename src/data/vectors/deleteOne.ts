import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for deleting a single record from the index.
 *
 * @see {@link Index.deleteOne }
 */
export type DeleteOneOptions = {
  /** The id of the record to delete from the index. */
  id: string;

  /**
   * The namespace to delete from. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
};

export const deleteOne = (
  apiProvider: VectorOperationsProvider,
  targetNamespace: string,
) => {
  const validator = (options: DeleteOneOptions) => {
    if (!options || !options.id) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `id` in order to delete a record.',
      );
    }
  };
  return async (options: DeleteOneOptions): Promise<void> => {
    validator(options);
    const namespace = options.namespace ?? targetNamespace;
    const api = await apiProvider.provide();
    await api.deleteVectors({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      deleteRequest: { ids: [options.id], namespace },
    });
    return;
  };
};
