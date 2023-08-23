import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';

export const deleteAll = (api: VectorOperationsApi, namespace: string) => {
  return async (): Promise<void> => {
    try {
      await api._delete({ deleteRequest: { deleteAll: true, namespace } });
      return;
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
