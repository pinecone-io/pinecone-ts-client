import { handleApiError } from '../errors';
import { VectorOperationsProvider } from './vectorOperationsProvider';

export const deleteAll = (apiProvider: VectorOperationsProvider, namespace: string) => {
  return async (): Promise<void> => {
    try {
      const api = await apiProvider.provide();
      await api._delete({ deleteRequest: { deleteAll: true, namespace } });
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
