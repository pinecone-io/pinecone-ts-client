import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';

/**
 * Deletes an Assistant by name.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * await pc.assistant.deleteAssistant('test1');
 * ```
 *
 * @param api - The `ManageAssistantsControlApi` object that defines the methods for interacting with the Assistant API.
 */
export const deleteAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<void> => {
    return await api.deleteAssistant({
      assistantName: assistantName,
    });
  };
};
