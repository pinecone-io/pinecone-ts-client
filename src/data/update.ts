import { DataOperationsProvider } from './dataOperationsProvider';
import type {
  RecordId,
  RecordValues,
  RecordSparseValues,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../errors';

/**
 * This type is very similar to { @link PineconeRecord }, but differs because the
 * values field is optional here. This is to allow for situations where perhaps
 * the caller only wants to update metadata for a given record while leaving
 * stored vector values as they are.
 */
export type UpdateOptions<T extends RecordMetadata = RecordMetadata> = {
  /** The id of the record you would like to update */
  id: RecordId;

  /** The vector values you would like to store with this record */
  values?: RecordValues;

  /** The sparse values you would like to store with this record.
   *
   * @see [Understanding hybrid search](https://docs.pinecone.io/docs/hybrid-search)
   */
  sparseValues?: RecordSparseValues;

  /**
   * The metadata you would like to store with this record.
   */
  metadata?: Partial<T>;
};

export class UpdateCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: DataOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = async (options: UpdateOptions<T>) => {
    if (options && !options.id) {
      throw new PineconeArgumentError(
        'You must enter a non-empty string for the `id` field in order to Update a record.'
      );
    }
  };

  async run(options: UpdateOptions<T>): Promise<void> {
    await this.validator(options);

    const requestOptions = {
      id: options['id'],
      values: options['values'],
      sparseValues: options['sparseValues'],
      setMetadata: options['metadata'],
    };

    const api = await this.apiProvider.provide();
    await api.update({
      updateRequest: { ...requestOptions, namespace: this.namespace },
    });
    return;
  }
}
