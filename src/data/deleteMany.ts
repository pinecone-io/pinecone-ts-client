import { VectorOperationsProvider } from './vectorOperationsProvider';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Type } from '@sinclair/typebox';
import type { DeleteRequest } from '../pinecone-generated-ts-fetch/models/DeleteRequest';
import { RecordIdSchema } from './types';
import type { RecordId } from './types';

const DeleteManyByRecordIdSchema = Type.Array(RecordIdSchema);

const DeleteManyByFilterSchema = Type.Object(
  {},
  { additionalProperties: true, minProperties: 1 }
);

const DeleteManySchema = Type.Union([
  DeleteManyByRecordIdSchema,
  DeleteManyByFilterSchema,
]);

/**
 * A list of record ids to delete from the index.
 */
export type DeleteManyByRecordIdOptions = Array<RecordId>;

/**
 * @see [Deleting vectors by metadata filter](https://docs.pinecone.io/docs/metadata-filtering#deleting-vectors-by-metadata-filter)
 */
export type DeleteManyByFilterOptions = object;

/**
 * Options that may be passed to { @link Index.deleteMany }
 */
export type DeleteManyOptions =
  | DeleteManyByRecordIdOptions
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
