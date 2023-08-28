import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import type { DeleteRequest } from '../pinecone-generated-ts-fetch/models/DeleteRequest';

const DeleteManyByVectorIdSchema = Type.Array(Type.String({ minLength: 1 }));

const DeleteManyByFilterSchema = Type.Object(
  {},
  { additionalProperties: true, minProperties: 1 }
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

    const requestOptions: DeleteRequest = {};

    if (Array.isArray(options)) {
      requestOptions.ids = options;
    } else {
      requestOptions.filter = options;
    }

    try {
      await api._delete({ deleteRequest: { ...requestOptions, namespace } });
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
