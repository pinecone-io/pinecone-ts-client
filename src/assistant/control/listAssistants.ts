import {
  type ListAssistants200Response,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

/**
 * Retrieves a list of all Assistants for a given Pinecone API key.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistants = await pc.assistant.listAssistants();
 * console.log(assistants);
 * // {
 * //  assistants: [
 * //    {
 * //      name: 'test2',
 * //      instructions: 'test-instructions',
 * //      metadata: [Object],
 * //      status: 'Ready',
 * //      host: 'https://prod-1-data.ke.pinecone.io',
 * //      createdAt: 2025-01-06T19:14:18.633Z,
 * //      updatedAt: 2025-01-06T19:14:36.977Z
 * //    },
 * //  ]
 * // }
 *
 * @param api - The `ManageAssistantsControlApi` object that defines the methods for interacting with the Assistant API.
 * @returns A Promise that resolves to an object containing an array of {@link Assistant} models.
 */
export const listAssistants = (api: ManageAssistantsControlApi) => {
  return async (): Promise<ListAssistants200Response> => {
    return await api.listAssistants();
  };
};
