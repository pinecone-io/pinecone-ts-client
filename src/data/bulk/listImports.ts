import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ListImportsResponse,
  ListBulkImportsRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';

export class ListImportsCommand {
  apiProvider: BulkOperationsProvider;

  constructor(apiProvider: BulkOperationsProvider) {
    this.apiProvider = apiProvider;
  }

  async run(
    limit?: number,
    paginationToken?: string,
  ): Promise<ListImportsResponse> {
    const req: ListBulkImportsRequest = {
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit: limit,
      paginationToken: paginationToken,
    };
    const api = await this.apiProvider.provide();

    return await api.listBulkImports(req);
  }
}
