import {
  type Assistant,
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

/**
 * The `createAssistantRequest` interface describes the name and optional configurations that can be
 * passed when creating an Assistant.
 */
export interface createAssistantRequest {
  /**
   * The name of the assistant. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
   */
  name: string;
  /**
   * Optional instructions for the Assistant. Instructions can [customize tone, role, and focus]https://www.pinecone.io/learn/assistant-api-deep-dive/#Custom-Instructions.
   */
  instructions?: string;
  /**
   * Optional metadata for the Assistant.
   */
  metadata?: Record<string, string>;
  /**
   * Optional region for the Assistant. The region is where the Assistant is deployed. The default region is 'us'.
   * The other option is 'eu'.
   */
  region?: string;
}

/**
 * Creates a new Assistant with the given name and optional configurations.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * await pc.assistant.createAssistant({name: 'test1'});
 * // {
 * //  name: 'test11',
 * //  instructions: undefined,
 * //  metadata: undefined,
 * //  status: 'Initializing',
 * //  host: 'https://prod-1-data.ke.pinecone.io',
 * //  createdAt: 2025-01-08T22:52:49.652Z,
 * //  updatedAt: 2025-01-08T22:52:49.652Z
 * // }
 *
 * @param api - The `ManageAssistantsControlApi` object that defines the methods for interacting with the Assistant API.
 * @returns A Promise that resolves to an {@link Assistant} model.
 */
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
