import {
  DeleteFileRequest,
  ManageAssistantsApi as ManageAssistantsApiData,
} from '../../pinecone-generated-ts-fetch/assistant_data';

export interface DeleteFile {
  fileId: string;
}

export const deleteFileClosed = (
  assistantName: string,
  api: ManageAssistantsApiData
) => {
  return async (options: DeleteFile) => {
    const request = {
      assistantName: assistantName,
      assistantFileId: options.fileId,
    } as DeleteFileRequest;
    return api.deleteFile(request);
  };
};
