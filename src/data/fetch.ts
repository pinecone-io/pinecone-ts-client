import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import { RecordIdSchema } from './types';
import type { PineconeRecord, RecordId, RecordMetadata } from './types';
import { Type } from '@sinclair/typebox';

const RecordIdsArray = Type.Array(RecordIdSchema, { minItems: 1 });
export type FetchOptions = Array<RecordId>;

export type FetchResponse<T extends RecordMetadata = RecordMetadata> = {
  records?: { [key: string]: PineconeRecord<T> };
  namespace?: string;
};

export class FetchCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;
  validator: ReturnType<typeof buildConfigValidator>;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
    this.validator = buildConfigValidator(RecordIdsArray, 'fetch');
  }

  async run(ids: FetchOptions): Promise<FetchResponse<T>> {
    this.validator(ids);

    try {
      const api = await this.apiProvider.provide();
      const response = await api.fetch({ ids: ids, namespace: this.namespace });

      return {
        records: response.vectors,
        namespace: response.namespace,
      } as FetchResponse<T>;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  }
}
