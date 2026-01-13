import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  FetchVectorsByMetadataRequest,
  Pagination,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { RecordMetadata, PineconeRecord, OperationUsage } from './types';
import { PineconeArgumentError } from '../../errors';

export type FetchByMetadataOptions = {
  filter?: object;
  limit?: number;
  paginationToken?: string;
};

/**
 *  The response from {@link Index.fetchByMetadata }
 *  @typeParam T - The metadata shape for each record: {@link RecordMetadata}.
 */
export type FetchByMetadataResponse<T extends RecordMetadata = RecordMetadata> =
  {
    records: {
      [key: string]: PineconeRecord<T>;
    };
    namespace: string;
    usage?: OperationUsage;
    pagination?: Pagination;
  };

export class FetchByMetadataCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: FetchByMetadataOptions) => {
    if (options && !options.filter) {
      throw new PineconeArgumentError(
        'You must pass a non-empty object for the `filter` field in order to fetch vectors by metadata.'
      );
    }
  };

  async run(
    options: FetchByMetadataOptions
  ): Promise<FetchByMetadataResponse<T>> {
    this.validator(options);
    const api = await this.apiProvider.provide();
    const request: FetchVectorsByMetadataRequest = {
      fetchByMetadataRequest: {
        namespace: this.namespace,
        filter: options.filter,
        limit: options.limit,
        paginationToken: options.paginationToken,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    };
    const response = await api.fetchVectorsByMetadata(request);
    return {
      records: response.vectors ? response.vectors : {},
      namespace: response.namespace ? response.namespace : '',
      ...(response.usage && { usage: response.usage }),
      pagination: response.pagination ? response.pagination : undefined,
    } as FetchByMetadataResponse<T>;
  }
}
