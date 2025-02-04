import {
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import type { CreateAssistantOptions, AssistantModel } from './types';

export const createAssistant = (api: ManageAssistantsControlApi) => {
  return async (options: CreateAssistantOptions): Promise<AssistantModel> => {
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
