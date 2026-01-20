import {
  AssistantFileModel as GeneratedAssistantFileModel,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type {
  AssistantFileModel,
  AssistantFilesList,
  ListFilesOptions,
} from './types';
import { mapAssistantFileStatus } from './fileStatus';

/**
 * Lists files (with optional filter) uploaded to an Assistant.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistantName = 'test1';
 * const assistant = pc.assistant({ name: assistantName });
 * const files = await assistant.listFiles({filter: {key: 'value'}});
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
  return async (options: ListFilesOptions): Promise<AssistantFilesList> => {
    const api = await apiProvider.provideData();
    const response = await api.listFiles({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      assistantName: assistantName,
      filter: options.filter && JSON.stringify(options.filter),
    });
    return {
      files: response.files?.map(mapAssistantFileModel),
    };
  };
};

const mapAssistantFileModel = (
  file: GeneratedAssistantFileModel
): AssistantFileModel => {
  return {
    ...file,
    status: mapAssistantFileStatus(file.status),
  };
};
