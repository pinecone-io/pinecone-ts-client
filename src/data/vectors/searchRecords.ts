import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  X_PINECONE_API_VERSION,
  SearchRecordsResponse,
  SearchMatchTerms,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { RetryOnServerFailure } from '../../utils';

/**
 * Options for searching records within a specific namespace.
 * @see [Upsert and search with integrated inference](https://docs.pinecone.io/guides/inference/integrated-inference).
 */
export type SearchRecordsOptions = {
  /**
   * The query to use for searching.
   */
  query: SearchRecordsQuery;
  /**
   * The fields to return in the search results. If not specified, the response will include all fields.
   */
  fields?: Array<string>;
  /**
   * Parameters to rerank the initial search results.
   */
  rerank?: SearchRecordsRerank;
};

/**
 * The query object used with a {@link SearchRecordsOptions } request.
 */
export type SearchRecordsQuery = {
  /**
   * The number of similar records to return.
   */
  topK: number;
  /**
   * The filter to apply. You can use vector metadata to limit your search.
   * @see [Understanding metadata](https://docs.pinecone.io/guides/data/understanding-metadata).
   */
  filter?: object;
  /**
   * The query text to search with. Searching with text is supported only for indexes with [integrated embedding](https://docs.pinecone.io/guides/indexes/create-an-index#integrated-embedding).
   */
  inputs?: object;
  /**
   * The {@link SearchRecordsVector} to search with, if provided.
   */
  vector?: SearchRecordsVector;
  /**
   * The unique ID of the vector to be used as a query vector.
   */
  id?: string;
  /**
   * Specifies which terms must be present in the text of each search hit based on the specified strategy.
   * The match is performed against the text field specified in the integrated index fieldMap configuration.
   * Terms are normalized and tokenized into single tokens before matching, and order does not matter.
   * Expected format: {strategy: "all", terms: ["term1", "term2", "term3"]}
   * Currently, only "all" strategy is supported, which means all specified terms must be present.
   *
   * **Limitations:** matchTerms is only supported for sparse indexes with integrated embedding configured to
   * use the pinecone-sparse-english-v0 model.
   */
  matchTerms?: SearchMatchTerms;
};

/**
 * A vector object used with a {@link SearchRecordsQuery } request.
 */
export type SearchRecordsVector = {
  /**
   * The dense embedding values to search with.
   */
  values?: Array<number>;
  /**
   * The sparse embedding values to search with.
   */
  sparseValues?: Array<number>;
  /**
   * The sparse embedding indices to search with.
   */
  sparseIndices?: Array<number>;
};

/**
 * Parameters used for reranking the initial search results.
 */
export type SearchRecordsRerank = {
  /**
   * The name of the [reranking model](https://docs.pinecone.io/guides/inference/understanding-inference#reranking-models) to use.
   */
  model: string;
  /**
   * The field(s) to consider for reranking. If not provided, the default is `["text"]`.
   * The number of fields supported is [model-specific](https://docs.pinecone.io/guides/inference/understanding-inference#reranking-models)
   */
  rankFields: Array<string>;
  /**
   * The number of top results to return after reranking. Defaults to the `topK` in {@link SearchRecordsQuery}.
   */
  topN?: number;
  /**
   * Additional model-specific parameters. Refer to the [model guide](https://docs.pinecone.io/guides/inference/understanding-inference#reranking-models)
   * for available model parameters.
   */
  parameters?: { [key: string]: any };
  /**
   * The query to rerank documents against. If a specific rerank query is specified,
   * it overwrites the query input that was provided at the top level.
   */
  query?: string;
};

export class SearchRecordsCommand {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: SearchRecordsOptions) => {
    if (!options.query) {
      throw new PineconeArgumentError(
        'You must pass a `query` object to search.'
      );
    }
  };

  async run(
    searchOptions: SearchRecordsOptions,
    maxRetries?: number
  ): Promise<SearchRecordsResponse> {
    this.validator(searchOptions);

    const api = await this.apiProvider.provide();

    const retryWrapper = new RetryOnServerFailure(
      api.searchRecordsNamespace.bind(api),
      maxRetries
    );

    return await retryWrapper.execute({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      searchRecordsRequest: searchOptions,
      namespace: this.namespace,
    });
  }
}
