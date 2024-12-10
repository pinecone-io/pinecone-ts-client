import {
  type AssistantFileModel,
  ManageAssistantsApi as ManageAssistantsApiData, UploadFileRequest
} from '../../pinecone-generated-ts-fetch/assistant_data';

export interface UploadFile {
  path: string;
  metadata?: string;
}

export const uploadFileClosed = (assistantName: string, api: ManageAssistantsApiData) => {
  return async (options: UploadFileRequest): Promise<AssistantFileModel> => {
    const request: UploadFileRequest = {assistantName: assistantName, file: options.file, metadata: options.metadata};
    return await api.uploadFile(request);
  };
};