import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  RecordIdSchema,
  RecordValuesSchema,
  RecordSparseValuesSchema,
  type RecordId,
  type RecordValues,
  type RecordSparseValues,
  type RecordMetadata,
} from './types';

const UpdateRecordOptionsSchema = Type.Object(
  {
    id: RecordIdSchema,
    values: Type.Optional(RecordValuesSchema),
    sparseValues: Type.Optional(RecordSparseValuesSchema),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);

// This is very similar to PineconeRecord, but differs because values field
// is optional here. E.g. perhaps the caller only wants to update metadata
// for a given record.
export type UpdateOptions<T extends RecordMetadata = RecordMetadata> = {
  id: RecordId;
  values?: RecordValues;
  sparseValues?: RecordSparseValues;
  metadata?: T;
};

export class UpdateCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;
  validator: ReturnType<typeof buildConfigValidator>;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
    this.validator = buildConfigValidator(UpdateRecordOptionsSchema, 'update');
  }

  async run(options: UpdateOptions<T>): Promise<void> {
    this.validator(options);

    const requestOptions = {
      id: options['id'],
      values: options['values'],
      sparseValues: options['sparseValues'],
      setMetadata: options['metadata'],
    };

    try {
      const api = await this.apiProvider.provide();
      await api.update({
        updateRequest: { ...requestOptions, namespace: this.namespace },
      });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  }
}
