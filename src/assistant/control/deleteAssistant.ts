import { ManageAssistantsApi as ManageAssistantsControlApi } from '../../pinecone-generated-ts-fetch/assistant_control';
import { PineconeArgumentError } from '../../errors';

export const deleteAssistant = (api: ManageAssistantsControlApi) => {
  return async (assistantName: string): Promise<void> => {
    if (!assistantName) {
      throw new PineconeArgumentError(
        'You must pass the name of an assistant to update.'
      );
    }
    return await api.deleteAssistant({
      assistantName: assistantName,
    });
  };
};
