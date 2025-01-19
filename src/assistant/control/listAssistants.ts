import {
  type ListAssistants200Response,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';

export const listAssistants = (api: ManageAssistantsControlApi) => {
  return async (): Promise<ListAssistants200Response> => {
    return await api.listAssistants();
  };
};
