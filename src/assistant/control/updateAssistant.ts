import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  type UpdateAssistant200Response,
} from '../../pinecone-generated-ts-fetch/assistant_control';

/**
 * Options for updating an assistant's properties.
 */
export interface UpdateAssistantOptions {
  /**
   * The name of the assistant to be updated.
   */
  assistantName: string;

  /**
   * Optional instructions for the assistant to apply to all responses.
   */
  instructions?: string;

  /**
   * Optional metadata associated with the assistant.
   */
  metadata?: Record<string, string>;
}

export const updateAssistant = (api: ManageAssistantsControlApi) => {
  return async (
    options: UpdateAssistantOptions
  ): Promise<UpdateAssistant200Response> => {
    const resp = await api.updateAssistant({
      assistantName: options.assistantName,
      updateAssistantRequest: {
        instructions: options?.instructions,
        metadata: options?.metadata,
      },
    });
    return {
      name: options.assistantName,
      instructions: resp.instructions,
      metadata: resp.metadata,
    } as UpdateAssistant200Response;
  };
};
