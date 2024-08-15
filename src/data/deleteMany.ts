import { DataOperationsProvider } from './dataOperationsProvider';
import type { DeleteRequest } from '../pinecone-generated-ts-fetch/data';
import type { RecordId } from './types';
import { PineconeArgumentError } from '../errors';

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
  apiProvider: DataOperationsProvider,
  namespace: string
) => {
  const FilterValidator = async (options: DeleteManyByFilterOptions) => {
    for (const key in options) {
      if (!options[key]) {
        throw new PineconeArgumentError('`filter` property cannot be empty');
      }
    }
  };

  const validator = async (options: DeleteManyOptions) => {
    if (!Array.isArray(options)) {
      return FilterValidator(options);
    } else {
      if (options.length === 0) {
        throw new PineconeArgumentError('Must pass in at least 1 record ID.');
      }
    }
  };

  return async (options: DeleteManyOptions): Promise<void> => {
    await validator(options);

    const requestOptions: DeleteRequest = {};

    if (Array.isArray(options)) {
      requestOptions.ids = options;
    } else {
      requestOptions.filter = options;
    }

    const api = await apiProvider.provide();
    await api._delete({ deleteRequest: { ...requestOptions, namespace } });
  };
};
