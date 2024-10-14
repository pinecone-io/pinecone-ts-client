import { VectorOperationsProvider } from './vectorOperationsProvider';
import type {
  OperationUsage,
  PineconeRecord,
  RecordId,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../../errors';

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

  async run(ids: FetchOptions): Promise<FetchResponse<T>> {
    this.validator(ids);
    const api = await this.apiProvider.provide();
    const response = await api.fetchVectors({
      ids: ids,
      namespace: this.namespace,
    });

    // My testing shows that in reality vectors and namespace are
    // never undefined even when there are no records returned. So these
    // default values are needed only to satisfy the typescript compiler.
    return {
      records: response.vectors ? response.vectors : {},
      namespace: response.namespace ? response.namespace : '',
      ...(response.usage && { usage: response.usage }),
    } as FetchResponse<T>;
  }
}
