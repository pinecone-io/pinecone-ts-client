import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';

import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

const nonemptyString = Type.String({ minLength: 1 });

export const SparseValuesSchema = Type.Object(
  {
    indices: Type.Array(Type.Integer()),
    values: Type.Array(Type.Number()),
  },
  { additionalProperties: false }
);

const Vector = Type.Object(
  {
    id: nonemptyString,
    values: Type.Array(Type.Number()),
    sparseValues: Type.Optional(SparseValuesSchema),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);

const VectorArray = Type.Array(Vector);

export type Vector = Static<typeof Vector>;
export type SparseValues = Static<typeof SparseValuesSchema>;
export type VectorArray = Static<typeof VectorArray>;

export const upsert = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(VectorArray, 'upsert');

  return async (vectors: VectorArray): Promise<void> => {
    validator(vectors);

    try {
      const api = await apiProvider.provide();
      await api.upsert({ upsertRequest: { vectors, namespace } });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
