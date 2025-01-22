import { DeleteFileRequest } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';

/**
 * The `DeleteFile` interface describes the file ID for deleting a file uploaded to an Assistant.
 */
export interface DeleteFile {
  /**
   * The ID of the file to delete.
   */
  fileId: string;
}

/**
 * Deletes a file uploaded to an Assistant by ID.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistantName = 'test1';
 * const assistant = pc.Assistant(assistantName);
 * const files = await assistant.listFiles();
 * let fileId: string;
 * if (files.files) {
 *    fileId = files.files[0].id;
 *    await assistant.deleteFile({fileId: fileId});
 *  }
 * ```
 *
 * @param assistantName - The name of the Assistant to delete the file from.
 * @param api - The Pinecone API object.
 */
export const deleteFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (options: DeleteFile) => {
    const api = await apiProvider.provideData();
    const request = {
      assistantName: assistantName,
      assistantFileId: options.fileId,
    } as DeleteFileRequest;
    return api.deleteFile(request);
  };
};
