import { VectorOperationsProvider } from './vectorOperationsProvider';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const DeleteOneOptionsSchema = Type.String({ minLength: 1 });

export type DeleteOneOptions = Static<typeof DeleteOneOptionsSchema>;

export const deleteOne = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(DeleteOneOptionsSchema, 'deleteOne');

  return async (options: DeleteOneOptions): Promise<void> => {
    validator(options);

    try {
      const api = await apiProvider.provide();
      await api._delete({ deleteRequest: { ids: [options], namespace } });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
