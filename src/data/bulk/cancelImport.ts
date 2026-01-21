import { BulkOperationsProvider } from './bulkOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';

export class CancelImportCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(id: string): Promise<object> {
    const req = {
      id: id,
    };
    const api = await this.apiProvider.provide();

    return await api.cancelBulkImport({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      ...req,
    });
  }
}
