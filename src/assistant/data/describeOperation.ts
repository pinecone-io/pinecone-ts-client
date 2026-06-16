import {
  X_PINECONE_API_VERSION,
  OperationModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { PineconeArgumentError } from '../../errors';

/**
 * Describes an async operation (such as a file upload or delete) performed on
 * an Assistant. Use this to poll the status of an {@link OperationModel}
 * returned by {@link uploadFile}, {@link upsertFile}, or {@link deleteFile}.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistant = pc.assistant({ name: 'test1' });
 * const op = await assistant.uploadFile({ path: 'report.pdf' });
 * const status = await assistant.describeOperation(op.id);
 * console.log(status.status); // 'Processing' | 'Completed' | 'Failed'
 * ```
 *
 * @param assistantName - The name of the Assistant that owns the operation.
 * @param apiProvider - The data plane operations provider.
 */
export const describeOperation = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
) => {
  return async (operationId: string): Promise<OperationModel> => {
    if (!operationId) {
      throw new PineconeArgumentError(
        'You must pass the operationId of an operation to describe.',
      );
    }
    const api = await apiProvider.provideData();
    return await api.describeOperation({
      assistantName: assistantName,
      operationId: operationId,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
