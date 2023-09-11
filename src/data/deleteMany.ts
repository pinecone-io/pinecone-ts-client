import { VectorOperationsProvider } from './vectorOperationsProvider';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Type } from '@sinclair/typebox';
import type { DeleteRequest } from '../pinecone-generated-ts-fetch/models/DeleteRequest';
import { RecordIdSchema } from './types';

const DeleteManyByRecordIdSchema = Type.Array(RecordIdSchema);

const DeleteManyByFilterSchema = Type.Object(
  {},
  { additionalProperties: true, minProperties: 1 }
);

const DeleteManySchema = Type.Union([
  DeleteManyByRecordIdSchema,
  DeleteManyByFilterSchema,
]);

export type DeleteManyByVectorIdOptions = Array<string>;
export type DeleteManyByFilterOptions = object;
export type DeleteManyOptions =
  | DeleteManyByVectorIdOptions
  | DeleteManyByFilterOptions;

export const deleteMany = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
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
      const api = await apiProvider.provide();
      await api._delete({ deleteRequest: { ...requestOptions, namespace } });
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
