import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  FetchVectorsByMetadataRequest,
  Pagination,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { RecordMetadata, PineconeRecord, OperationUsage } from './types';
import { PineconeArgumentError } from '../../errors';

/**
 * The options that may be passed to {@link Index.fetchByMetadata}
 *
 * @see [Fetch records by metadata](https://docs.pinecone.io/guides/manage-data/fetch-data#fetch-records-by-metadata)
 */
export type FetchByMetadataOptions = {
  /**
   * The metadata filter to apply when fetching records. Only records matching this filter will be returned.
   *
   * @see [Metadata filtering](https://docs.pinecone.io/docs/metadata-filtering)
   */
  filter: object;

  /** The maximum number of records to return. If unspecified, the server will use a default value. */
  limit?: number;

  /** A token needed to fetch the next page of results. This token is returned in the response if additional results are available. */
  paginationToken?: string;

  /**
   * The namespace to fetch from. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
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
    if (!options || !options.filter) {
      throw new PineconeArgumentError(
        'You must pass a non-empty object for the `filter` field in order to fetch by metadata.',
      );
    }
  };

  async run(
    options: FetchByMetadataOptions,
  ): Promise<FetchByMetadataResponse<T>> {
    this.validator(options);
    const namespace = options.namespace ?? this.namespace;
    const api = await this.apiProvider.provide();
    const request: FetchVectorsByMetadataRequest = {
      fetchByMetadataRequest: {
        namespace,
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
