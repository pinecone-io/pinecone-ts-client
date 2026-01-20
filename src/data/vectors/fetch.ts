import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type {
  OperationUsage,
  PineconeRecord,
  RecordId,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../../errors';
import { RetryOnServerFailure } from '../../utils';

/** The list of record ids you would like to fetch using { @link Index.fetch } */
export type FetchOptions = Array<RecordId>;

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
    if (options.length === 0) {
      throw new PineconeArgumentError('Must pass in at least 1 recordID.');
    }
  };

  async run(ids: FetchOptions, maxRetries?: number): Promise<FetchResponse<T>> {
    this.validator(ids);
    const api = await this.apiProvider.provide();

    const retryWrapper = new RetryOnServerFailure(
      api.fetchVectors.bind(api),
      maxRetries
    );
    const response = await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      ids: ids,
      namespace: this.namespace,
    });

    // Vectors and Namespace should never actually be undefined, but we need to satisfy the typescript compiler.
    return {
      records: response.vectors ? response.vectors : {},
      namespace: response.namespace ? response.namespace : '',
      ...(response.usage && { usage: response.usage }),
    } as FetchResponse<T>;
  }
}
