import { VectorOperationsProvider } from './vectorOperationsProvider';
import type { Vector } from '../../pinecone-generated-ts-fetch/db_data';
import {
  PineconeRecord,
  PineconeRecordsProperties,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../../errors';
import { ValidateObjectProperties } from '../../utils/validateObjectProperties';
import { RetryOnServerFailure } from '../../utils';

export class UpsertCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (records: Array<PineconeRecord<T>>) => {
    for (const record of records) {
      ValidateObjectProperties(record, PineconeRecordsProperties);
    }
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
      upsertRequest: {
        vectors: records as Array<Vector>,
        namespace: this.namespace,
      },
    });
  }
}
