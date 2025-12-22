import {
  GetAssistantRequest,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import type { AssistantModel } from './types';
import { PineconeArgumentError } from '../../errors';
import { withAssistantControlApiVersion } from './apiVersion';

export const describeAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<AssistantModel> => {
    if (!assistantName) {
      throw new PineconeArgumentError(
        'You must pass the name of an assistant to update.'
      );
    }
    return (await api.getAssistant(
      withAssistantControlApiVersion<GetAssistantRequest>({
        assistantName: assistantName,
      })
    )) as AssistantModel;
  };
};
