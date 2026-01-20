import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type { Vector } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeRecord, RecordMetadata } from './types';
import { PineconeArgumentError } from '../../errors';
import { RetryOnServerFailure } from '../../utils';

export class UpsertCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (records: Array<PineconeRecord<T>>) => {
    if (records.length === 0) {
      throw new PineconeArgumentError(
        'Must pass in at least 1 record to upsert.'
      );
    }
    records.forEach((record) => {
      if (!record.id) {
        throw new PineconeArgumentError(
          'Every record must include an `id` property in order to upsert.'
        );
      }
      if (!record.values && !record.sparseValues) {
        throw new PineconeArgumentError(
          'Every record must include either `values` or `sparseValues` in order to upsert.'
        );
      }
    });
  };

  async run(
    records: Array<PineconeRecord<T>>,
    maxRetries?: number
  ): Promise<void> {
    this.validator(records);

    const api = await this.apiProvider.provide();

    const retryWrapper = new RetryOnServerFailure(
      api.upsertVectors.bind(api),
      maxRetries
    );

    await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      upsertRequest: {
        vectors: records as Array<Vector>,
        namespace: this.namespace,
      },
    });
  }
}
