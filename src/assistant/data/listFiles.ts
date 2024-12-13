import {
  ListFilesRequest,
  ManageAssistantsApi as ManageAssistantsApiData,
} from '../../pinecone-generated-ts-fetch/assistant_data';

export interface ListFiles {
  filter?: object;
}

export const listFilesClosed = (
  assistantName: string,
  api: ManageAssistantsApiData
) => {
  return async (options: ListFiles) => {
    const request = {
      assistantName: assistantName,
      filter: options.filter,
    } as ListFilesRequest;
    return api.listFiles(request);
  };
};
