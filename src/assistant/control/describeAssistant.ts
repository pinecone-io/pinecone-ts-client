import {
  type Assistant,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

/**
 * Retrieves information about an Assistant by name.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const test = await pc.assistant.getAssistant('test1');
 * console.log(test);
 * // {
 * //  name: 'test10',
 * //  instructions: undefined,
 * //  metadata: undefined,
 * //  status: 'Ready',
 * //  host: 'https://prod-1-data.ke.pinecone.io',
 * //  createdAt: 2025-01-08T22:24:50.525Z,
 * //  updatedAt: 2025-01-08T22:24:52.303Z
 * // }
 *
 * @param api - The `ManageAssistantsControlApi` object that defines the methods for interacting with the Assistant API.
 * @returns A Promise that resolves to an {@link Assistant} model.
 */
export const describeAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<Assistant> => {
    return await api.getAssistant({
      assistantName: assistantName,
    });
  };
};
