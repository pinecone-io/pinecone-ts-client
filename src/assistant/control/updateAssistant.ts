import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';
import type { UpdateAssistantOptions, UpdateAssistantResponse } from './types';

export const updateAssistant = (api: ManageAssistantsControlApi) => {
  return async (
    options: UpdateAssistantOptions
  ): Promise<UpdateAssistantResponse> => {
    return await api.updateAssistant({
      assistantName: options.assistantName,
      updateAssistantRequest: {
        instructions: options?.instructions,
        metadata: options?.metadata,
      },
    });
  };
};
