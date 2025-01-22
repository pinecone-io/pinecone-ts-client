import {
  type Assistant,
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

/**
 * The `CreateAssistantOptions` interface describes the name and optional configurations that can be
 * passed when creating an Assistant.
 */
export interface CreateAssistantOptions {
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

export const createAssistant = (api: ManageAssistantsControlApi) => {
  return async (options: CreateAssistantOptions): Promise<Assistant> => {
    if (options.region) {
      let region: CreateAssistantRequestRegionEnum =
        CreateAssistantRequestRegionEnum.Us;
      if (
        !Object.values(CreateAssistantRequestRegionEnum)
          .toString()
          .includes(options.region.toLowerCase())
      ) {
        throw new Error(
          'Invalid region specified. Must be one of "us" or "eu"'
        );
      } else {
        region =
          options.region.toLowerCase() as CreateAssistantRequestRegionEnum;
      }
      options.region = region;
    }

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
