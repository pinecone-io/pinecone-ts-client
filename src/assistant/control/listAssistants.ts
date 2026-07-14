import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import type { AssistantList } from './types';

export const listAssistants = (api: ManageAssistantsControlApi) => {
  return async (): Promise<AssistantList> => {
    return await api.listAssistants({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
