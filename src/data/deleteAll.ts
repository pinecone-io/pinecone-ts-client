import { DataOperationsProvider } from './dataOperationsProvider';

export const deleteAll = (
  apiProvider: DataOperationsProvider,
  namespace: string,
) => {
  return async (): Promise<void> => {
    const api = await apiProvider.provide();
    await api._delete({ deleteRequest: { deleteAll: true, namespace } });
    return;
  };
};
