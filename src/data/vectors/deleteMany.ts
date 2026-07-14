import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type { DeleteRequest } from '../../pinecone-generated-ts-fetch/db_data';
import type { RecordId } from './types';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for deleting multiple records from the index.
 * Either `ids` or `filter` must be provided, but not both.
 *
 * @see {@link Index.deleteMany}
 */
export type DeleteManyOptions = {
  /**
   * A list of record ids to delete from the index.
   * Mutually exclusive with `filter`.
   */
  ids?: Array<RecordId>;

  /**
   * A metadata filter expression to determine which records to delete.
   * Mutually exclusive with `ids`.
   *
   * @see [Deleting vectors by metadata filter](https://docs.pinecone.io/docs/metadata-filtering#deleting-vectors-by-metadata-filter)
   */
  filter?: object;

  /**
   * The namespace to delete from. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
};

export const deleteMany = (
  apiProvider: VectorOperationsProvider,
  targetNamespace: string,
) => {
  const validator = (options: DeleteManyOptions) => {
    if (!options.ids && !options.filter) {
      throw new PineconeArgumentError(
        'Either `ids` or `filter` must be provided.',
      );
    }
    if (options.ids && options.filter) {
      throw new PineconeArgumentError(
        'Cannot provide both `ids` and `filter`. Use either `ids` to delete specific records or `filter` to delete by metadata.',
      );
    }
    if (options.ids && options.ids.length === 0) {
      throw new PineconeArgumentError('Must pass in at least 1 record ID.');
    }
    if (options.filter) {
      for (const key in options.filter) {
        if (!options.filter[key]) {
          throw new PineconeArgumentError(
            `\`filter\` property cannot be empty for key ${key}`,
          );
        }
      }
    }
  };

  return async (options: DeleteManyOptions): Promise<void> => {
    validator(options);

    const namespace = options.namespace ?? targetNamespace;
    const requestOptions: DeleteRequest = {};

    if (options.ids) {
      requestOptions.ids = options.ids;
    } else if (options.filter) {
      requestOptions.filter = options.filter;
    }

    const api = await apiProvider.provide();
    await api.deleteVectors({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      deleteRequest: { ...requestOptions, namespace },
    });
    return;
  };
};
