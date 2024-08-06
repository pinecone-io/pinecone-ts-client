import { DataOperationsProvider } from './dataOperationsProvider';
import { buildConfigValidator } from '../validator';
import { RecordIdSchema } from './types';
import type { RecordId } from './types';

/**
 * The id of the record to delete from the index.
 *
 * @see {@link Index.deleteOne }
 */
export type DeleteOneOptions = RecordId;

export const deleteOne = (
  apiProvider: DataOperationsProvider,
  namespace: string,
) => {
  const validator = buildConfigValidator(RecordIdSchema, 'deleteOne');

  return async (options: DeleteOneOptions): Promise<void> => {
    validator(options);

    const api = await apiProvider.provide();
    await api._delete({ deleteRequest: { ids: [options], namespace } });
    return;
  };
};
