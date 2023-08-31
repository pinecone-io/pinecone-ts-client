import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

const SparseValues = Type.Object(
  {
    indices: Type.Array(Type.Integer()),
    values: Type.Array(Type.Number()),
  },
  { additionalProperties: false }
);

const UpdateVectorOptionsSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    values: Type.Optional(Type.Array(Type.Number())),
    sparseValues: Type.Optional(SparseValues),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);

export type UpdateVectorOptions = Static<typeof UpdateVectorOptionsSchema>;

export const update = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(UpdateVectorOptionsSchema, 'update');

  return async (options: UpdateVectorOptions): Promise<void> => {
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
