import { OperationUsage, RecordValues, RecordSparseValues } from './types';
import type { PineconeRecord, RecordMetadata } from './types';
import { DataOperationsProvider } from './dataOperationsProvider';
import { PineconeArgumentError } from '../errors';

/**
 * @see [Query data](https://docs.pinecone.io/docs/query-data)
 */
export type QueryShared = {
  /** The number of query results you would like returned. */
  topK: number;

  /**
   * This boolean value specifies whether embedding values are returned with query results.
   *
   * By default, values are not returned to reduce the size of the request payload.
   */
  includeValues?: boolean;

  /**
   * This boolean value specifies whether metadata values are returned with query results.
   *
   * By default, metadata values are not returned to reduce the size of the request payload.
   */
  includeMetadata?: boolean;

  /**
   * This parameter allows you to modify your query with a metadata filter.
   *
   * @see [Metadata filtering](https://docs.pinecone.io/docs/metadata-filtering)
   */
  filter?: object;
};

/**
 * Include an `id` in your query configuration along with properties defined in
 * { @link QueryShared } if you want to use vector values from a record in the
 * index as your query.
 *
 * @see [Querying data](https://docs.pinecone.io/docs/query-data)
 */
export type QueryByRecordId = QueryShared & {
  /**
   * Specifies the {@link RecordId} of a record whose `values` you'd
   * like to query with.
   */
  id: string;
};

/**
 * Include vector values in your query configuration along with properties defined
 * in { @link QueryShared }.
 *
 * @see [Querying data](https://docs.pinecone.io/docs/query-data)
 */
export type QueryByVectorValues = QueryShared & {
  /**
   * Vector values output from an embedding model.
   */
  vector: RecordValues;

  /**
   * The sparse values of the query vector, if applicable.
   */
  sparseVector?: RecordSparseValues;
};
/**
 * The options that may be passed to {@link Index.query }
 */
export type QueryOptions = QueryByRecordId | QueryByVectorValues;

/**
 * A {@link PineconeRecord} with a similarity score.
 */
export interface ScoredPineconeRecord<T extends RecordMetadata = RecordMetadata>
  extends PineconeRecord<T> {
  /**
   * The similarity score of the record. The interpretation of this score will be different
   * depending on the distance metric configured on the index.
   *
   * For indexes using the `euclidean` distance metric, a lower similarity score is more
   * similar, while for indexes using the `dotproduct` metric, higher scores are more similar.
   */
  score?: number;
}

/**
 * Response from { @link Index.query }
 *
 * @see [Query data](https://docs.pinecone.io/docs/query-data)
 */
export type QueryResponse<T extends RecordMetadata = RecordMetadata> = {
  /** The query results sorted by similarity */
  matches: Array<ScoredPineconeRecord<T>>;

  /** The namespace where the query was executed. */
  namespace: string;

  /** The usage information for the query operation. */
  usage?: OperationUsage;
};

export class QueryCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: DataOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = async (options: QueryOptions) => {
    if (!options) {
      throw new PineconeArgumentError(
        'You must enter a query configuration object to query the index.'
      );
    }
    if (options && !options.topK) {
      throw new PineconeArgumentError(
        'You must enter an integer for the `topK` search results to be returned.'
      );
    }
    if (options && options.topK && options.topK < 1) {
      throw new PineconeArgumentError('`topK` field must be greater than 0.');
    }
    if (options && options.filter) {
      const keys = Object.keys(options.filter);
      if (keys.length === 0) {
        throw new PineconeArgumentError(
          'You must enter a filter object with at least one key-value pair.'
        );
      }
    }
    if ('id' in options) {
      if (!options.id) {
        throw new PineconeArgumentError(
          'You must enter non-empty string for recordID to query by record ID.'
        );
      }
    }
    if ('vector' in options) {
      if (options.vector.length === 0) {
        throw new PineconeArgumentError(
          'You must enter an Array of RecordValues to query by vector values.'
        );
      }
    }
    if ('sparseVector' in options) {
      if (
        options.sparseVector?.indices.length === 0 ||
        options.sparseVector?.values.length === 0
      ) {
        throw new PineconeArgumentError(
          'You must enter a RecordSparseValues object with indices and values in order to query by sparse' +
            ' vector values.'
        );
      }
    }
  };

  async run(query: QueryOptions): Promise<QueryResponse<T>> {
    await this.validator(query);
    const api = await this.apiProvider.provide();
    const results = await api.query({
      queryRequest: { ...query, namespace: this.namespace },
    });
    const matches = results.matches ? results.matches : [];

    return {
      matches: matches as Array<ScoredPineconeRecord<T>>,
      namespace: this.namespace,
      ...(results.usage && { usage: results.usage }),
    };
  }
}
