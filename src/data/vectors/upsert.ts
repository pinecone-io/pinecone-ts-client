import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type { Vector } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeRecord, RecordMetadata } from './types';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for upserting records to the index.
 *
 * @see {@link Index.upsert}
 */
export type UpsertOptions<T extends RecordMetadata = RecordMetadata> = {
  /** The records to upsert */
  records: Array<PineconeRecord<T>>;

  /**
   * The namespace to upsert into. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
};

export class UpsertCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: UpsertOptions<T>) => {
    if (!options.records || options.records.length === 0) {
      throw new PineconeArgumentError(
        'Must pass in at least 1 record to upsert.',
      );
    }
    options.records.forEach((record) => {
      if (!record.id) {
        throw new PineconeArgumentError(
          'Every record must include an `id` property in order to upsert.',
        );
      }
      if (!record.values && !record.sparseValues) {
        throw new PineconeArgumentError(
          'Every record must include either `values` or `sparseValues` in order to upsert.',
        );
      }
    });
  };

  async run(options: UpsertOptions<T>): Promise<void> {
    this.validator(options);
    const namespace = options.namespace ?? this.namespace;

    const api = await this.apiProvider.provide();
    await api.upsertVectors({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      upsertRequest: {
        vectors: options.records as Array<Vector>,
        namespace,
      },
    });
  }
}
