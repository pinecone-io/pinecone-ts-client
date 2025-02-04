import { ListFilesRequest } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ListFilesOptions } from './types';

/**
 * Lists files (with optional filter) uploaded to an Assistant.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistantName = 'test1';
 * const assistant = pc.Assistant(assistantName);
 * const files = await assistant.listFiles({filter: {metadata: {key: 'value'}}});
 * console.log(files);
 * // {
 * //  files: [
 * //    {
 * //      name: 'test-file.txt',
 * //      id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
 * //      metadata: [Object],
 * //      createdOn: 2025-01-06T19:14:21.969Z,
 * //      updatedOn: 2025-01-06T19:14:36.925Z,
 * //      status: 'Available',
 * //      percentDone: 1,
 * //      signedUrl: undefined,
 * //      errorMessage: undefined
 * //    }
 * //  ]
 * // }
 * ```
 * @param assistantName - The name of the Assistant that the files are uploaded to.
 * @param api - The API object to use to send the request.
 */
export const listFiles = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (options: ListFilesOptions) => {
    const api = await apiProvider.provideData();
    const request = {
      assistantName: assistantName,
      filter: options.filter,
    } as ListFilesRequest;
    return api.listFiles(request);
  };
};
