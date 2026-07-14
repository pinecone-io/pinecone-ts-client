import {
  ManageAssistantsApi as ManageAssistantsControlApi,
  X_PINECONE_API_VERSION,
  Assistant as AssistantModel,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import { PineconeArgumentError } from '../../errors';

export const describeAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<AssistantModel> => {
    if (!assistantName) {
      throw new PineconeArgumentError(
        'You must pass the name of an assistant to update.',
      );
    }
    return await api.getAssistant({
      assistantName: assistantName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
