import { BulkOperationsProvider } from './bulkOperationsProvider';

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
    return await api.cancelImport(req);
  }
}
