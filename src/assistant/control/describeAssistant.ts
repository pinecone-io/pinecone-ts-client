import {
  type Assistant,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

export const describeAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<Assistant> => {
    return await api.getAssistant({
      assistantName: assistantName,
    });
  };
};
