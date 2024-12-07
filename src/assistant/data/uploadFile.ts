import {
  type AssistantFileModel,
  ManageAssistantsApi as ManageAssistantsApiData, UploadFileRequest
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { promises as fs } from 'fs';


export interface UploadRequest {
  assistantName: string;
  filePath: string;
  metadata?: string;
}


async function filePathToBlob(filePath: string): Promise<Blob> {
  // Read the file as a Buffer
  const fileBuffer = await fs.readFile(filePath);
  // Create a Blob from the Buffer
}

export const uploadFileClosed = (api: ManageAssistantsApiData) => {
  return async (options: UploadRequest): Promise<AssistantFileModel> => {
    const path = await filePathToBlob(options.filePath);

    console.log("Type of path = ", typeof path);

    const request: UploadFileRequest = {assistantName: options.assistantName, file: path, metadata: options.metadata};

    return api.uploadFile(request);
  };
}