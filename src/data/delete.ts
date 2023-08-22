import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const idsArray = Type.Array(Type.String({ minLength: 1 }));
const deleteAll = Type.Boolean();
const filter = Type.Optional(Type.Object({}, { additionalProperties: true }));

const DeleteVectorOptionsSchema = Type.Object({
  ids: Type.Optional(idsArray),
  deleteAll: Type.Optional(deleteAll),
  filter: Type.Optional(filter),
});

export type DeleteVectorOptions = Static<typeof DeleteVectorOptionsSchema>;

export const deleteVector = (api: VectorOperationsApi, namespace: string) => {
  const validator = buildConfigValidator(
    DeleteVectorOptionsSchema,
    'delete'
  );

  return async (options: DeleteVectorOptions): Promise<void> => {
    validator(options);

    try {
      await api._delete({ deleteRequest: { ...options, namespace } });
      return;
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
