import {
  InferenceApi,
  RerankResult,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/inference';
import { PineconeArgumentError } from '../errors';

/**
 * Options for reranking documents against a query.
 */
export interface RerankOptions {
  /**
   * The [model](https://docs.pinecone.io/guides/search/rerank-results#reranking-models) to use for reranking.
   */
  model: string;

  /**
   * The query to rerank documents against.
   */
  query: string;

  /**
   * The documents to rerank.
   */
  documents: Array<{ [key: string]: string } | string>;

  /**
   * The number of results to return sorted by relevance. Defaults to the number of inputs.
   */
  topN?: number;

  /**
   * Whether to return the documents in the response.
   */
  returnDocuments?: boolean;

  /**
   * The field(s) to consider for reranking. If not provided, the default is `["text"]`.
   *
   * The number of fields supported is [model-specific](https://docs.pinecone.io/guides/search/rerank-results#reranking-models).
   */
  rankFields?: Array<string>;

  /**
   * Additional model-specific parameters. Refer to the [model guide](https://docs.pinecone.io/guides/search/rerank-results#reranking-models) for available model parameters.
   */
  parameters?: { [key: string]: string };
}

export const rerank = (infApi: InferenceApi) => {
  return async (options: RerankOptions): Promise<RerankResult> => {
    if (!options.documents || options.documents.length == 0) {
      throw new PineconeArgumentError(
        'You must pass at least one document to rerank',
      );
    }
    if (!options.query || options.query.length == 0) {
      throw new PineconeArgumentError('You must pass a query to rerank');
    }
    if (!options.model || options.model.length == 0) {
      throw new PineconeArgumentError(
        'You must pass the name of a supported reranking model in order to rerank' +
          ' documents. See https://docs.pinecone.io/models for supported models.',
      );
    }

    const topN = options.topN ?? options.documents.length;
    const returnDocuments = options.returnDocuments ?? true;
    const parameters = options.parameters ?? {};
    let rankFields = options.rankFields ?? ['text'];

    // Validate and standardize documents to ensure they are in object format
    const newDocuments = options.documents.map((doc) =>
      typeof doc === 'string' ? { text: doc } : doc,
    );

    if (!options.rankFields) {
      if (!newDocuments.every((doc) => typeof doc === 'object' && doc.text)) {
        throw new PineconeArgumentError(
          'Documents must be a list of strings or objects containing the "text" field',
        );
      }
    }

    if (options.rankFields) {
      rankFields = options.rankFields;
    }

    return await infApi.rerank({
      rerankRequest: {
        model: options.model,
        query: options.query,
        documents: newDocuments,
        topN: topN,
        returnDocuments: returnDocuments,
        rankFields: rankFields,
        parameters: parameters,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
