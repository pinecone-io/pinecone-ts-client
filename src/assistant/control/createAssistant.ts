import {
  type Assistant,
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

export interface createAssistantRequest {
  name: string;
  instructions?: string;
  metadata?: Record<string, string>;
  region?: string;
}

export const createAssistantClosed = (api: ManageAssistantsControlApi) => {
  return async (options: createAssistantRequest): Promise<Assistant> => {
    return await api.createAssistant({
      createAssistantRequest: {
        name: options.name,
        instructions: options?.instructions,
        metadata: options?.metadata,
        region: options?.region as CreateAssistantRequestRegionEnum,
      },
    });
  };
};
