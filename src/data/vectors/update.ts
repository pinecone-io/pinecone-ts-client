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

/**
 * Partial changes for {@link Index.update}. Select one record by `id`, or use a
 * metadata `filter` to update metadata on matching records. Unspecified fields are preserved.
 */
export type UpdateOptions<T extends RecordMetadata = RecordMetadata> = {
  /**
   * The record ID, such as `trail-shoe-42`; mutually exclusive with `filter`.
   */
  id?: RecordId;

  /**
   * Replacement dense vector values for an update by ID.
   */
  values?: RecordValues;

  /**
   * Replacement sparse vector values for an update by ID.
   */
  sparseValues?: RecordSparseValues;

  /**
   * Metadata fields to add or replace. Other stored metadata fields are preserved.
   */
  metadata?: Partial<T>;

  /**
   * Select records whose metadata should change. Mutually exclusive with `id`;
   * provide the changes in `metadata`.
   *
   * @see [Metadata
   * filtering](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata)
   */
  filter?: object;

  /**
   * The namespace to update in. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
};

export class UpdateCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: UpdateOptions<T>) => {
    if (options && !options.id && !options.filter) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for the `id` field or a `filter` object in order to update records.',
      );
    }
    if (options && options.id && options.filter) {
      throw new PineconeArgumentError(
        'You cannot pass both an `id` and a `filter` object to update records. Use either `id` to update a single record, or `filter` to update multiple records.',
      );
    }
  };

  async run(options: UpdateOptions<T>): Promise<void> {
    this.validator(options);

    const namespace = options.namespace ?? this.namespace;
    const request: UpdateRequest = {
      id: options['id'],
      values: options['values'],
      sparseValues: options['sparseValues'],
      // `Partial<T>` allows `undefined` values, which `MetadataValue` does not.
      // `JSON.stringify` drops those keys, so the request is well-formed.
      setMetadata: options['metadata'] as UpdateRequest['setMetadata'],
      filter: options['filter'],
      namespace,
    };

    const api = await this.apiProvider.provide();
    await api.updateVector({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      updateRequest: request,
    });
    return;
  }
}
