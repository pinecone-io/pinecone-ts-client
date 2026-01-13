import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  UpdateRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import type {
  RecordId,
  RecordValues,
  RecordSparseValues,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../../errors';
import { ValidateObjectProperties } from '../../utils/validateObjectProperties';
import { RetryOnServerFailure } from '../../utils';

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

  /**
   * A metadata filter expression. When provided, updates all vectors in the namespace that match
   * the filter criteria. Must not be provided when using id. Either `id` or `filter` must be provided.
   *
   * @see [Metadata filtering](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata)
   */
  filter?: object;
};

// Properties for validation to ensure no unknown/invalid properties are passed
type UpdateOptionsType = keyof UpdateOptions;
const UpdateOptionsProperties: UpdateOptionsType[] = [
  'id',
  'values',
  'sparseValues',
  'metadata',
  'filter',
];

export class UpdateCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: UpdateOptions<T>) => {
    if (options) {
      ValidateObjectProperties(options, UpdateOptionsProperties);
    }
    if (options && !options.id && !options.filter) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for the `id` field or a `filter` object in order to update records.'
      );
    }
    if (options && options.id && options.filter) {
      throw new PineconeArgumentError(
        'You cannot pass both an `id` and a `filter` object to update records. Use either `id` to update a single record, or `filter` to update multiple records.'
      );
    }
  };

  async run(options: UpdateOptions<T>, maxRetries?: number): Promise<void> {
    this.validator(options);

    const request: UpdateRequest = {
      id: options['id'],
      values: options['values'],
      sparseValues: options['sparseValues'],
      setMetadata: options['metadata'],
      filter: options['filter'],
      namespace: this.namespace,
    };

    const api = await this.apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.updateVector.bind(api),
      maxRetries
    );

    await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      updateRequest: request,
    });
    return;
  }
}
