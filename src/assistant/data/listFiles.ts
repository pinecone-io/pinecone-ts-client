import {
  ListFilesRequest,
  ManageAssistantsApi as ManageAssistantsApiData,
} from '../../pinecone-generated-ts-fetch/assistant_data';

/**
 * The `ListFiles` interface describes the options (a single filter) that can be passed to the `listFiles` method.
 */
export interface ListFiles {
  /**
   * A filter object to filter the files returned by the `listFiles` method.
   */
  filter?: object;
}

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
 * //      name: 'temp-file.txt',
 * //      id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
 * //      metadata: undefined,
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
