import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const DeleteManyByVectorIdSchema = Type.Object(
  {
    ids: Type.Array(Type.String({ minLength: 1 })),
    deleteAll: Type.Optional(Type.Never()),
    filter: Type.Optional(Type.Never()),
  },
  { additionalProperties: false }
);

const DeleteManyByFilterSchema = Type.Object(
  {
    ids: Type.Optional(Type.Never()),
    deleteAll: Type.Optional(Type.Never()),
    filter: Type.Object({}, { additionalProperties: true }),
  },
  { additionalProperties: false }
);

const DeleteManySchema = Type.Union([
  DeleteManyByVectorIdSchema,
  DeleteManyByFilterSchema,
]);

export type DeleteManyByVectorIdOptions = Static<
  typeof DeleteManyByVectorIdSchema
>;
export type DeleteManyByFilterOptions = Static<typeof DeleteManyByFilterSchema>;
export type DeleteManyOptions = Static<typeof DeleteManySchema>;

export const deleteMany = (api: VectorOperationsApi, namespace: string) => {
  const validator = buildConfigValidator(DeleteManySchema, 'deleteMany');

  return async (options: DeleteManyOptions): Promise<void> => {
    validator(options);

    try {
      await api._delete({ deleteRequest: { ...options, namespace } });
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
