import { VectorOperationsProvider } from './vectorOperationsProvider';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { RecordIdSchema, type RecordId } from './types';

export type DeleteOneOptions = RecordId;

export const deleteOne = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(RecordIdSchema, 'deleteOne');

  return async (options: RecordId): Promise<void> => {
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
