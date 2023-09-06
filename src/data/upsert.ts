import { handleApiError, PineconeBatchUpsertError } from '../errors';
import { buildConfigValidator } from '../validator';
import { PineconeRecordSchema, type PineconeRecord } from './types';
import { Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import type { Vector } from '../pinecone-generated-ts-fetch';
import type { RecordMetadataValue } from './types';

const RecordArray = Type.Array(PineconeRecordSchema);

export class UpsertCommand<T extends Record<string, RecordMetadataValue>> {
  apiProvider: VectorOperationsProvider;
  namespace: string;
  validator: ReturnType<typeof buildConfigValidator>;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
    this.validator = buildConfigValidator(RecordArray, 'upsert');
  }

  async run(records: Array<PineconeRecord<T>>): Promise<void> {
    this.validator(records);

    try {
      const api = await this.apiProvider.provide();
      await api.upsert({
        upsertRequest: {
          vectors: records as Array<Vector>,
          namespace: this.namespace,
        },
      });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  }
}
