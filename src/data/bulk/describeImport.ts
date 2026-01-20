import { BulkOperationsProvider } from './bulkOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type { ImportModel } from '../../pinecone-generated-ts-fetch/db_data';
import { RetryOnServerFailure } from '../../utils';

export class DescribeImportCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(id: string, maxRetries?: number): Promise<ImportModel> {
    const req = {
      id: id,
    };
    const api = await this.apiProvider.provide();
    const retryWrapper = new RetryOnServerFailure(
      api.describeBulkImport.bind(api),
      maxRetries
    );
    return await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      ...req,
    });
  }
}
