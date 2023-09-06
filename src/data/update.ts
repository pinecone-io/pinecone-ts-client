import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  RecordIdSchema,
  RecordValuesSchema,
  RecordSparseValuesSchema,
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

export type UpdateOptions = Static<typeof UpdateRecordOptionsSchema>;

export const update = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(UpdateRecordOptionsSchema, 'update');

  return async (options: UpdateOptions): Promise<void> => {
    validator(options);

    const requestOptions = {
      id: options['id'],
      values: options['values'],
      sparseValues: options['sparseValues'],
      setMetadata: options['metadata'],
    };

    try {
      const api = await apiProvider.provide();
      await api.update({ updateRequest: { ...requestOptions, namespace } });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
