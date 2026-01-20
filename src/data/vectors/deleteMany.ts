import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type { DeleteRequest } from '../../pinecone-generated-ts-fetch/db_data';
import type { RecordId } from './types';
import { PineconeArgumentError } from '../../errors';
import { RetryOnServerFailure } from '../../utils';

/**
 * A list of record ids to delete from the index.
 */
export type DeleteManyByRecordIdOptions = Array<RecordId>;

/**
 * @see [Deleting vectors by metadata filter](https://docs.pinecone.io/docs/metadata-filtering#deleting-vectors-by-metadata-filter)
 */
export type DeleteManyByFilterOptions = object;

/**
 * Options that may be passed to { @link Index.deleteMany }
 */
export type DeleteManyOptions =
  | DeleteManyByRecordIdOptions
  | DeleteManyByFilterOptions;

export const deleteMany = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const FilterValidator = (options: DeleteManyByFilterOptions) => {
    for (const key in options) {
      if (!options[key]) {
        throw new PineconeArgumentError(
          `\`filter\` property cannot be empty for key ${key}`
        );
      }
    }
  };

  const validator = (options: DeleteManyOptions) => {
    if (!Array.isArray(options)) {
      return FilterValidator(options);
    } else {
      if (options.length === 0) {
        throw new PineconeArgumentError('Must pass in at least 1 record ID.');
      }
    }
  };

  return async (
    options: DeleteManyOptions,
    maxRetries?: number
  ): Promise<void> => {
    validator(options);

    const requestOptions: DeleteRequest = {};

    if (Array.isArray(options)) {
      requestOptions.ids = options;
    } else {
      requestOptions.filter = options;
    }

    const api = await apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.deleteVectors.bind(api),
      maxRetries
    );
    await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      deleteRequest: { ...requestOptions, namespace },
    });
  };
};
