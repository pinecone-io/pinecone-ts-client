import { DescribeFileRequest } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { AssistantFileModel } from './types';
import { PineconeArgumentError } from '../../errors';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/assistant_data';
import { mapAssistantFileStatus } from './fileStatus';

/**
 * Describes a file uploaded to an Assistant.
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
 *     fileId = files.files[0].id;
 * } else {
 *     fileId = '';
 * }
 * const resp = await assistant.describeFile({fileId: fileId})
 * console.log(resp);
 * // {
 * //  name: 'test-file.txt',
 * //  id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
 * //  metadata: undefined,
 * //  createdOn: 2025-01-06T19:14:21.969Z,
 * //  updatedOn: 2025-01-06T19:14:36.925Z,
 * //  status: 'Available',
 * //  percentDone: 1,
 * //  signedUrl: undefined,
 * //   errorMessage: undefined
 * // }
 * ```
 *
 * @param assistantName - The name of the Assistant that the file is uploaded to.
 * @param api - The API object to use to send the request.
 * @returns A promise that resolves to a {@link AssistantFile} object containing the file details.
 */
export const describeFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (
    fileId: string,
    includeUrl: boolean
  ): Promise<AssistantFileModel> => {
    if (!fileId) {
      throw new PineconeArgumentError(
        'You must pass the fileId of a file to describe.'
      );
    }
    const api = await apiProvider.provideData();
    const response = await api.describeFile({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      assistantName: assistantName,
      assistantFileId: fileId,
      includeUrl: includeUrl.toString(),
    });
    return {
      ...response,
      status: mapAssistantFileStatus(response.status),
    };
  };
};
