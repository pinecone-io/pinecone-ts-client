import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ListImportsResponse,
  ListBulkImportsRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { RetryOnServerFailure } from '../../utils';

export class ListImportsCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(
    limit?: number,
    paginationToken?: string,
    maxRetries?: number
  ): Promise<ListImportsResponse> {
    const req: ListBulkImportsRequest = {
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit: limit,
      paginationToken: paginationToken,
    };
    const api = await this.apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.listBulkImports.bind(api),
      maxRetries
    );
    return await retryWrapper.execute(req);
  }
}
