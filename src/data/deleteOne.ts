import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const DeleteOneOptionsSchema = Type.String({ minLength: 1 });

export type DeleteOneOptions = Static<typeof DeleteOneOptionsSchema>;

export const deleteOne = (api: VectorOperationsApi, namespace: string) => {
  const validator = buildConfigValidator(DeleteOneOptionsSchema, 'deleteOne');

  return async (options: DeleteOneOptions): Promise<void> => {
    validator(options);

    try {
      await api._delete({ deleteRequest: { ids: [options], namespace } });
      return;
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
