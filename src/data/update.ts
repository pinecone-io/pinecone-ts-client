import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  RecordIdSchema,
  RecordValuesSchema,
  RecordSparseValuesSchema,
  type PineconeRecord,
  type RecordMetadataValue
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

export interface UpdateOptions<T extends Record<string, RecordMetadataValue>> extends PineconeRecord<T> {};

export class UpdateCommand<T extends Record<string, RecordMetadataValue>> {
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
      await api.update({ updateRequest: { ...requestOptions, namespace: this.namespace } });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
}