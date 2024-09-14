// import {
//   BulkOperationsApi,
//   StartImportOperationRequest,
//   StartImportRequest,
//   StartImportResponse, type Vector
// } from '../pinecone-generated-ts-fetch/db_data';
import { PineconeRecord, RecordMetadata } from './types';
import { DataOperationsProvider } from './dataOperationsProvider';


export type StartImportOptions<T extends RecordMetadata = RecordMetadata> = {}

export class StartImportCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: DataOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  async run(options: StartImportOptions<T>): Promise<void> {

    return;
  }
}