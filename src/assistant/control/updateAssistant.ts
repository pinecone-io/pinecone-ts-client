import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';
import type { UpdateAssistantOptions, UpdateAssistantResponse } from './types';
import { UpdateAssistantOptionsType } from './types';
import { ValidateObjectProperties } from '../../utils/validateObjectProperties';
import { PineconeArgumentError } from '../../errors';

export const updateAssistant = (api: ManageAssistantsControlApi) => {
  return async (
    name: string,
    options: UpdateAssistantOptions
  ): Promise<UpdateAssistantResponse> => {
    if (!name) {
      throw new PineconeArgumentError(
        'You must pass the name of an assistant to update.'
      );
    }

    validateUpdateAssistantOptions(options);
    return await api.updateAssistant({
      assistantName: name,
      updateAssistantRequest: {
        instructions: options?.instructions,
        metadata: options?.metadata,
      },
    });
  };
};

const validateUpdateAssistantOptions = (options: UpdateAssistantOptions) => {
  if (!options) {
    throw new PineconeArgumentError(
      'You must pass an object with at least one property to update an assistant.'
    );
  }
  ValidateObjectProperties(options, UpdateAssistantOptionsType);
};
