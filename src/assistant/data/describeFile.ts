import { DescribeFileRequest } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';

/**
 * The `DescribeFile` interface describes the options that can be passed to the `describeFile` method.
 */
export interface DescribeFile {
  /**
   * The ID of the file to describe.
   */
  fileId: string;
  /**
   * Whether to include a signed URL for the file. Points to a GCP bucket if `true`.
   */
  includeUrl?: boolean;
}

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
 * @returns A promise that resolves to a {@link AssistantFileModel} object containing the file details.
 */
export const describeFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (options: DescribeFile) => {
    const api = await apiProvider.provideData();
    const request = {
      assistantName: assistantName,
      assistantFileId: options.fileId,
      includeUrl: options.includeUrl,
    } as DescribeFileRequest;
    return api.describeFile(request);
  };
};
