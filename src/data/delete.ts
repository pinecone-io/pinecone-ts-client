import { VectorOperationsProvider } from './vectorOperationsProvider';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const idsArray = Type.Array(Type.String({ minLength: 1 }));
const deleteAll = Type.Boolean();
const filter = Type.Optional(Type.Object({}, { additionalProperties: true }));

const DeleteVectorOptionsSchema = Type.Object(
  {
    ids: Type.Optional(idsArray),
    deleteAll: Type.Optional(deleteAll),
    filter: Type.Optional(filter),
  },
  { additionalProperties: false }
);

export type DeleteVectorOptions = Static<typeof DeleteVectorOptionsSchema>;

export const deleteVector = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(DeleteVectorOptionsSchema, 'delete');

  return async (options: DeleteVectorOptions): Promise<void> => {
    validator(options);

    try {
      const api = await apiProvider.provide();
      await api._delete({ deleteRequest: { ...options, namespace } });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
