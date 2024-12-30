import {
  type ListAssistants200Response,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

export const listAssistantsClosed = (api: ManageAssistantsControlApi) => {
  return async (): Promise<ListAssistants200Response> => {
    return await api.listAssistants();
  };
};
