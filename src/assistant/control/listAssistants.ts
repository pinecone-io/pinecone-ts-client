import {
  ListAssistantsRequest,
  ManageAssistantsApi as ManageAssistantsControlApi,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import type { AssistantList } from './types';
import { withAssistantControlApiVersion } from './apiVersion';

export const listAssistants = (api: ManageAssistantsControlApi) => {
  return async (): Promise<AssistantList> => {
    return (await api.listAssistants(
      withAssistantControlApiVersion<ListAssistantsRequest>({})
    )) as AssistantList;
  };
};
