import { BulkOperationsProvider } from './bulkOperationsProvider';
import type { ImportModel } from '../../pinecone-generated-ts-fetch/db_data';

export class DescribeImportCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(id: string): Promise<ImportModel> {
    const req = {
      id: id,
    };
    const api = await this.apiProvider.provide();
    return await api.describeImport(req);
  }
}
