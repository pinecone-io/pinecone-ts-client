import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ImportErrorMode,
  StartBulkImportRequest,
  StartImportResponse,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for starting a bulk import operation.
 */
export interface StartImportOptions {
  /**
   * Object-storage directory containing the namespaces and Parquet files to import,
   * for example `s3://product-data/catalog-import`.
   *
   * @see [Prepare import
   * data](https://docs.pinecone.io/guides/index-data/import-data#prepare-your-data)
   */
  uri: string;

  /**
   * How to handle import errors: `continue` (the default) skips errors; `abort` stops the import.
   */
  errorMode?: 'continue' | 'abort';

  /**
   * The id of the [storage
   * integration](https://docs.pinecone.io/guides/operations/integrations/manage-storage-integrations)
   * that should be used to access the data.
   */
  integration?: string;
}

export class StartImportCommand {
  apiProvider: BulkOperationsProvider;

  constructor(apiProvider: BulkOperationsProvider) {
    this.apiProvider = apiProvider;
  }

  async run(options: StartImportOptions): Promise<StartImportResponse> {
    if (!options.uri) {
      throw new PineconeArgumentError(
        '`uri` field is required and must start with the scheme of a supported storage provider.',
      );
    }

    let error: ImportErrorMode['onError'] = 'continue';

    if (options.errorMode) {
      if (
        options.errorMode.toLowerCase() !== 'continue' &&
        options.errorMode.toLowerCase() !== 'abort'
      ) {
        throw new PineconeArgumentError(
          '`errorMode` must be one of "continue" or "abort"',
        );
      }
      if (options.errorMode.toLowerCase() == 'abort') {
        error = 'abort';
      }
    }

    const req: StartBulkImportRequest = {
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      startImportRequest: {
        uri: options.uri,
        errorMode: { onError: error },
        integrationId: options.integration,
      },
    };

    const api = await this.apiProvider.provide();
    return await api.startBulkImport(req);
  }
}
