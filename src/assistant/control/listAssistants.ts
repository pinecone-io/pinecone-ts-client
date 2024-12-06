import {
  type ListAssistants200Response,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

// todo: validations
// todo: get ListAssistants200Response to be just ListAssistantsResponse
export const listAssistantsClosed = (api: ManageAssistantsControlApi) => {
  return async (): Promise<ListAssistants200Response> => {
    return await api.listAssistants();
  };
};
