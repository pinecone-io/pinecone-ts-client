import {
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import type { CreateAssistantOptions, AssistantModel } from './types';
import { CreateAssistantOptionsType } from './types';
import { ValidateObjectProperties } from '../../utils/validateObjectProperties';
import { PineconeArgumentError } from '../../errors';

export const createAssistant = (api: ManageAssistantsControlApi) => {
  return async (options: CreateAssistantOptions): Promise<AssistantModel> => {
    validateCreateAssistantOptions(options);
    return (await api.createAssistant({
      createAssistantRequest: {
        name: options.name,
        instructions: options?.instructions,
        metadata: options?.metadata,
        region: options?.region as CreateAssistantRequestRegionEnum,
      },
    })) as AssistantModel;
  };
};

const validateCreateAssistantOptions = (options: CreateAssistantOptions) => {
  if (!options) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`name`) to create an Assistant.'
    );
  }

  ValidateObjectProperties(options, CreateAssistantOptionsType);

  if (options.region) {
    let region: CreateAssistantRequestRegionEnum =
      CreateAssistantRequestRegionEnum.Us;
    if (
      !Object.values(CreateAssistantRequestRegionEnum)
        .toString()
        .includes(options.region.toLowerCase())
    ) {
      throw new PineconeArgumentError(
        'Invalid region specified. Must be one of "us" or "eu"'
      );
    } else {
      region = options.region.toLowerCase() as CreateAssistantRequestRegionEnum;
    }
    options.region = region;
  }
};
