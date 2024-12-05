import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  type UpdateAssistant200Response,
  UpdateAssistantOperationRequest,
  UpdateAssistantRequest,
} from '../../pinecone-generated-ts-fetch/assistant_control';

// todo: validations
export const updateAssistant = (api: ManageAssistantsControlApi) => {
  return async (
    options: UpdateAssistantOperationRequest & UpdateAssistantRequest
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
