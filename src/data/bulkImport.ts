import { BulkOperationsProvider } from './bulkOperationsProvider';
import {
  ImportErrorModeOnErrorEnum,
  ImportListResponse,
  type ImportModel,
  ListImportsRequest,
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
    errorMode?: string | undefined,
    integration?: string | undefined
  ): Promise<StartImportResponse> {
    if (!uri) {
      throw new PineconeArgumentError(
        '`uri` field is required and must start with the scheme of a supported storage provider.'
      );
    }

    let error: ImportErrorModeOnErrorEnum = ImportErrorModeOnErrorEnum.Continue;

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
        error = ImportErrorModeOnErrorEnum.Abort;
      }
    }

    const req: StartImportOperationRequest = {
      startImportRequest: {
        uri: uri,
        errorMode: { onError: error },
        integration: integration,
      },
    };

    const api = await this.apiProvider.provide();
    return await api.startImport(req);
  }
}

export class ListImportCommand {
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
