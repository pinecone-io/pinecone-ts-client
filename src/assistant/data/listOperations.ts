import {
  X_PINECONE_API_VERSION,
  OperationList,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ListOperationsOptions } from './types';

/**
 * Lists the async operations (such as file uploads and deletes) performed on an
 * Assistant, with optional filters.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistant = pc.assistant({ name: 'test1' });
 * const { operations } = await assistant.listOperations({ status: 'Processing' });
 * console.log(operations);
 * ```
 *
 * @param assistantName - The name of the Assistant whose operations to list.
 * @param apiProvider - The data plane operations provider.
 * @returns A promise that resolves to an {@link OperationList} object.
 */
export const listOperations = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
) => {
  return async (options: ListOperationsOptions): Promise<OperationList> => {
    const api = await apiProvider.provideData();
    return await api.listOperations({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      assistantName: assistantName,
      operationType: options.operationType,
      status: options.status,
      limit: options.limit,
      paginationToken: options.paginationToken,
    });
  };
};
