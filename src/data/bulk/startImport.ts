import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ImportErrorMode,
  StartBulkImportRequest,
  StartImportResponse,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

export class StartImportCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(
    uri: string,
    errorMode?: string | undefined,
    integrationId?: string | undefined
  ): Promise<StartImportResponse> {
    if (!uri) {
      throw new PineconeArgumentError(
        '`uri` field is required and must start with the scheme of a supported storage provider.'
      );
    }

    let error: ImportErrorMode['onError'] = 'continue';

    if (errorMode) {
      if (
        errorMode.toLowerCase() !== 'continue' &&
        errorMode.toLowerCase() !== 'abort'
      ) {
        throw new PineconeArgumentError(
          '`errorMode` must be one of "Continue" or "Abort"'
        );
      }
      if (errorMode?.toLowerCase() == 'abort') {
        error = 'abort';
      }
    }

    const req: StartBulkImportRequest = {
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      startImportRequest: {
        uri: uri,
        errorMode: { onError: error },
        integrationId: integrationId,
      },
    };

    const api = await this.apiProvider.provide();
    return await api.startBulkImport(req);
  }
}
