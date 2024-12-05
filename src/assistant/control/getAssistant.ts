import {
  type Assistant,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

// todo: validations
export const getAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<Assistant> => {
    return await api.getAssistant({
      assistantName: assistantName,
    });
  };
};
