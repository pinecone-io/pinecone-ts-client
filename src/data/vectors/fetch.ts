import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type {
  OperationUsage,
  PineconeRecord,
  RecordId,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for fetching records from the index.
 * @see {@link Index.fetch}
 */
export type FetchOptions = {
  /** The list of record ids you would like to fetch */
  ids: Array<RecordId>;

  /**
   * The namespace to fetch from. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
};

/**
 *  The response from {@link Index.fetch }
 *  @typeParam T - The metadata shape for each record: {@link RecordMetadata}.
 */
export type FetchResponse<T extends RecordMetadata = RecordMetadata> = {
  /** A map of fetched records, keyed by record id. */
  records: {
    [key: string]: PineconeRecord<T>;
  };

  /** The namespace where records were fetched. */
  namespace: string;

  /** The usage information for the fetch operation. */
  usage?: OperationUsage;
};

export class FetchCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: FetchOptions) => {
    if (!options.ids || options.ids.length === 0) {
      throw new PineconeArgumentError('Must pass in at least 1 recordID.');
    }
  };

  async run(options: FetchOptions): Promise<FetchResponse<T>> {
    this.validator(options);
    const namespace = options.namespace ?? this.namespace;
    const api = await this.apiProvider.provide();

    const response = await api.fetchVectors({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      ids: options.ids,
      namespace,
    });

    // Vectors and Namespace should never actually be undefined, but we need to satisfy the typescript compiler.
    return {
      records: response.vectors ? response.vectors : {},
      namespace: response.namespace ? response.namespace : '',
      ...(response.usage && { usage: response.usage }),
    } as FetchResponse<T>;
  }
}
