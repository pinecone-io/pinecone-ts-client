import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';
import type { AssistantList } from './types';

export const listAssistants = (api: ManageAssistantsControlApi) => {
  return async (): Promise<AssistantList> => {
    return await api.listAssistants();
  };
};
