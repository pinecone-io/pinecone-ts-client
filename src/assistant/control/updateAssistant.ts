import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';
import type { UpdateAssistantOptions, UpdateAssistantResponse } from './types';

export const updateAssistant = (api: ManageAssistantsControlApi) => {
  return async (
    name: string,
    options: UpdateAssistantOptions
  ): Promise<UpdateAssistantResponse> => {
    return await api.updateAssistant({
      assistantName: name,
      updateAssistantRequest: {
        instructions: options?.instructions,
        metadata: options?.metadata,
      },
    });
  };
};
