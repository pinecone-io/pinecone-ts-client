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
   * The URI of the bucket (or container) and import directory containing the namespaces and Parquet files you want to import. For example, `s3://BUCKET_NAME/IMPORT_DIR` for Amazon S3, `gs://BUCKET_NAME/IMPORT_DIR` for Google Cloud Storage, or `https://STORAGE_ACCOUNT.blob.core.windows.net/CONTAINER_NAME/IMPORT_DIR` for Azure Blob Storage. For more information, see [Import records](https://docs.pinecone.io/guides/index-data/import-data#prepare-your-data).
   */
  uri: string;

  /**
   * Indicates how to respond to errors during the import process.
   * Possible values: `abort` or `continue`.
   */
  errorMode?: 'continue' | 'abort';

  /**
   * The id of the [storage integration](https://docs.pinecone.io/guides/operations/integrations/manage-storage-integrations) that should be used to access the data.
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
      if (options.errorMode?.toLowerCase() == 'abort') {
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
