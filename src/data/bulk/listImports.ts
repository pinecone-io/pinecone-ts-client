import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ImportListResponse,
  ListImportsRequest,
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
  ): Promise<ImportListResponse> {
    const req = {
      limit: limit,
      paginationToken: paginationToken,
    } as ListImportsRequest;
    const api = await this.apiProvider.provide();
    return await api.listImports(req);
  }
}
