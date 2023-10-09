import { VectorOperationsProvider } from './vectorOperationsProvider';

export const deleteAll = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  return async (): Promise<void> => {
    const api = await apiProvider.provide();
    await api._delete({ deleteRequest: { deleteAll: true, namespace } });
    return;
  };
};
