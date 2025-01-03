import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  type UpdateAssistant200Response,
  UpdateAssistantOperationRequest,
  UpdateAssistantRequest,
} from '../../pinecone-generated-ts-fetch/assistant_control';

export interface updateAssistant {
  assistantName: string;
  instructions?: string;
  metadata?: Record<string, string>;
}

export const updateAssistantClosed = (api: ManageAssistantsControlApi) => {
  return async (
    options: updateAssistant
  ): Promise<UpdateAssistant200Response> => {
    return await api.updateAssistant({
      assistantName: options.assistantName,
      updateAssistantRequest: {
        instructions: options?.instructions,
        metadata: options?.metadata,
      },
    });
  };
};
