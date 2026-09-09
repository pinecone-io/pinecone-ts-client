import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  X_PINECONE_API_VERSION,
  SearchRecordsResponse,
  SearchMatchTerms,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for searching records within a specific namespace.
 * @see [Upsert and search with integrated
 * inference](https://docs.pinecone.io/guides/inference/integrated-inference).
 */
export type SearchRecordsOptions = {
  /**
   * The query to use for searching.
   */
  query: SearchRecordsQuery;
  /**
   * The fields to return in the search results. If not specified, the response will include all
   * fields.
   */
  fields?: Array<string>;
  /**
   * Parameters to rerank the initial search results.
   */
  rerank?: SearchRecordsRerank;
  /**
   * The namespace to search in. If not specified, uses the namespace configured on the Index.
   */
  namespace?: string;
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
   * Embedding inputs, such as `{ text: "waterproof hiking shoes" }`.
   * Requires an index with integrated embedding.
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
   * Require matching terms in the text field configured by the index field map,
   * for example `{ strategy: "all", terms: ["hiking", "waterproof"] }`.
   * Supported for compatible sparse indexes with integrated embedding.
   *
   * @see [Integrated embedding](https://docs.pinecone.io/guides/inference/integrated-inference)
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
   * The name of the [reranking
   * model](https://docs.pinecone.io/guides/inference/understanding-inference#reranking-models) to
   * use.
   */
  model: string;
  /**
   * Text fields to use for reranking, such as `["chunk_text"]`. Choose fields supported by the
   * model.
   */
  rankFields: Array<string>;
  /**
   * The number of top results to return after reranking. Defaults to the `topK` in {@link
   * SearchRecordsQuery}.
   */
  topN?: number;
  /**
   * Additional model-specific parameters. Refer to the [model
   * guide](https://docs.pinecone.io/guides/inference/understanding-inference#reranking-models)
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
        'You must pass a `query` object to search.',
      );
    }
  };

  async run(
    searchOptions: SearchRecordsOptions,
  ): Promise<SearchRecordsResponse> {
    this.validator(searchOptions);
    const namespace = searchOptions.namespace ?? this.namespace;
    const api = await this.apiProvider.provide();
    return await api.searchRecordsNamespace({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      searchRecordsRequest: searchOptions,
      namespace,
    });
  }
}
