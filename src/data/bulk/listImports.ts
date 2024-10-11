import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ListImportsResponse,
  ListBulkImportsRequest,
} from '../../pinecone-generated-ts-fetch/db_data';

export class ListImportsCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(
    limit?: number,
    paginationToken?: string
  ): Promise<ListImportsResponse> {
    const req = {
      limit: limit,
      paginationToken: paginationToken,
    } as ListBulkImportsRequest;
    const api = await this.apiProvider.provide();
    return await api.listBulkImports(req);
  }
}
