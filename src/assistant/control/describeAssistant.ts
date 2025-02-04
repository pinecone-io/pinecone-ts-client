import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';
import type { AssistantModel } from './types';

export const describeAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<AssistantModel> => {
    return await api.getAssistant({
      assistantName: assistantName,
    });
  };
};
