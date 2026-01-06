import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { PineconeArgumentError } from '../../errors';

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
  return async (fileId: string): Promise<void> => {
    if (!fileId) {
      throw new PineconeArgumentError(
        'You must pass the fileId of a file to delete.'
      );
    }
    const api = await apiProvider.provideData();
    return await api.deleteFile({
      assistantName: assistantName,
      assistantFileId: fileId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
