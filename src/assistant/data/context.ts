import {
  ContextAssistantRequest,
  ManageAssistantsApi as ManageAssistantsApiData,
} from '../../pinecone-generated-ts-fetch/assistant_data';

export interface Context {
  query: string;
  filter?: Record<string, string>;
}

export const contextClosed = (
  assistantName: string,
  api: ManageAssistantsApiData
) => {
  return async (options: Context) => {
    if (!options.query) {
      throw new Error('Must provide a query');
    }
    const request = {
      assistantName: assistantName,
      contextRequest: {
        query: options.query,
        filter: options.filter,
      },
    } as ContextAssistantRequest;
    return api.contextAssistant(request);
  };
};
