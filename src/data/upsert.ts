import { DataOperationsProvider } from './dataOperationsProvider';
import type { Vector } from '../pinecone-generated-ts-fetch/data';
import type { PineconeRecord, RecordMetadata } from './types';
import { PineconeArgumentError } from '../errors';
import { ValidateProperties } from '../utils/validateProperties';

export class UpsertCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: DataOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = async (records: Array<PineconeRecord<T>>) => {
    for (const record of records) {
      ValidateProperties(record, ['id', 'values', 'sparseValues', 'metadata']);
    }
    if (records.length === 0) {
      throw new PineconeArgumentError(
        'Must pass in at least 1 record to upsert.'
      );
    }
    records.forEach((record) => {
      if (!record.id) {
        throw new PineconeArgumentError(
          'Every record must have an `id` property in order to upsert.'
        );
      }
      if (!record.values) {
        throw new PineconeArgumentError(
          'Every record must include a `values` property in order to upsert.'
        );
      }
    });
  };

  async run(records: Array<PineconeRecord<T>>): Promise<void> {
    await this.validator(records);

    const api = await this.apiProvider.provide();
    await api.upsert({
      upsertRequest: {
        vectors: records as Array<Vector>,
        namespace: this.namespace,
      },
    });
    return;
  }
}
