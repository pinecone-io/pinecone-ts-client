import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  type UpdateAssistant200Response,
} from '../../pinecone-generated-ts-fetch/assistant_control';

// TODO: docstrings
export interface UpdateAssistantOptions {
  assistantName: string;
  instructions?: string;
  metadata?: Record<string, string>;
}

/**
 * Updates an Assistant by name.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * await pc.assistant.updateAssistant({name: 'test1', instructions: 'some new  instructions!'});
 * // {
 * //  assistantName: test1,
 * //  instructions: 'some new instructions!',
 * //  metadata: undefined
 * // }
 * ```
 * @param api - The `ManageAssistantsControlApi` object that defines the methods for interacting with the Assistant API.
 * @throws Error if the Assistant API is not initialized.
 * @returns A Promise that resolves to an {@link UpdateAssistant200Response} object.
 */
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
