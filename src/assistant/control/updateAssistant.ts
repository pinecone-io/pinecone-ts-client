import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_control';
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
    const updateAssistantRequest = {};
    if (options?.instructions) {
      updateAssistantRequest['instructions'] = options.instructions;
    }
    if (options?.metadata) {
      updateAssistantRequest['metadata'] = options.metadata;
    }

    return await api.updateAssistant({
      assistantName: name,
      updateAssistantRequest: updateAssistantRequest,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
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
