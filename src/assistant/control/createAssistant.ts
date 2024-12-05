import {
  type Assistant,
  CreateAssistantRequest,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

// todo: validations
export const createAssistant = (api: ManageAssistantsControlApi) => {
  return async (options: CreateAssistantRequest): Promise<Assistant> => {
    return await api.createAssistant({
      createAssistantRequest: {
        name: options.name,
        instructions: options?.instructions,
        metadata: options?.metadata,
      },
    });
  };
};
