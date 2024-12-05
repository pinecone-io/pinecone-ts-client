import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';

// todo: validations
export const deleteAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<void> => {
    return await api.deleteAssistant({
      assistantName: assistantName,
    });
  };
};
