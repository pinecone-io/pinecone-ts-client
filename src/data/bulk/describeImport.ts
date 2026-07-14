import { BulkOperationsProvider } from './bulkOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type { ImportModel } from '../../pinecone-generated-ts-fetch/db_data';

export class DescribeImportCommand {
  apiProvider: BulkOperationsProvider;

  constructor(apiProvider: BulkOperationsProvider) {
    this.apiProvider = apiProvider;
  }

  async run(id: string): Promise<ImportModel> {
    const req = {
      id: id,
    };
    const api = await this.apiProvider.provide();

    return await api.describeBulkImport({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      ...req,
    });
  }
}
