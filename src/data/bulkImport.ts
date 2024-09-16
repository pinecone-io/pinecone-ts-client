import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ImportErrorModeOnErrorEnum,
  StartImportOperationRequest,
  StartImportResponse,
} from '../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../errors';

export class StartImportCommand {
  apiProvider: BulkOperationsProvider;
  namespace: string;

  constructor(apiProvider: BulkOperationsProvider, namespace: string) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(
    uri: string,
    errorMode: string | undefined
  ): Promise<StartImportResponse> {
    if (
      errorMode?.toLowerCase() !== 'continue' &&
      errorMode?.toLowerCase() !== 'abort'
    ) {
      throw new PineconeArgumentError(
        '`errorMode` must be one of "Continue" or "Abort"'
      );
    }

    let error: ImportErrorModeOnErrorEnum = ImportErrorModeOnErrorEnum.Continue;
    if (errorMode?.toLowerCase() == 'abort') {
      error = ImportErrorModeOnErrorEnum.Abort;
    }

    const req: StartImportOperationRequest = {
      startImportRequest: {
        uri: uri,
        errorMode: { onError: error },
      },
    };

    const api = await this.apiProvider.provide();

    return await api.startImport(req);
  }
}
