import {
  EmbedOperationRequest,
  EmbedRequestInputsInner,
  EmbedRequestParameters,
  InferenceApi,
  RerankResult,
} from '../pinecone-generated-ts-fetch/inference';
import { EmbeddingsList } from '../models';
import { PineconeArgumentError } from '../errors';
import { prerelease } from '../utils/prerelease';

export interface RerankOptions {
  topN?: number;
  returnDocuments?: boolean;
  rankFields?: Array<string>;
  decay?: boolean;
  decayThreshold?: number;
  decayWeight?: number;
  parameters?: { [key: string]: string };
}

/* This class is the class through which users interact with Pinecone's inference API.  */
export class Inference {
  _inferenceApi: InferenceApi;

  constructor(inferenceApi: InferenceApi) {
    this._inferenceApi = inferenceApi;
  }

  /* Format the input data into the correct format for the Inference API request. */
  public _formatInputs(data: Array<string>): Array<EmbedRequestInputsInner> {
    return data.map((str) => {
      return { text: str };
    });
  }

  /* Format the parameters object into the correct format for the Inference API request. */
  public _formatParams(
    parameters: Record<string, string>
  ): EmbedRequestParameters {
    return parameters;
  }

  /* Generate embeddings for a list of input strings using a specified embedding model. */
  async embed(
    model: string,
    inputs: Array<string>,
    params: Record<string, string>
  ): Promise<EmbeddingsList> {
    const typedAndFormattedInputs: Array<EmbedRequestInputsInner> =
      this._formatInputs(inputs);
    const typedParams: EmbedRequestParameters = this._formatParams(params);
    const typedRequest: EmbedOperationRequest = {
      embedRequest: {
        model: model,
        inputs: typedAndFormattedInputs,
        parameters: typedParams,
      },
    };
    const response = await this._inferenceApi.embed(typedRequest);
    return new EmbeddingsList(response.model, response.data, response.usage);
  }

  /* Add an additive recency decay to a ranked results list from the /embed endpoint.
   *
   * Additive decay means we *add* a decay factor to the original score (vs multiplying it, or taking the log of it,
   *  etc.).
   *
   * The factors that contribute to the final score are:
   * - Document timestamp: The timestamp of the document, provided in string form, including ms (e.g. "2013-09-05
   *  15:34:00").
   * - Today's date: Today's timestamp.
   * - decayThreshold (default 30 days): Time period (in days) after which the decay starts significantly affecting.
   *  If a document is within the threshold, the decay will scale based on how old the document is. If it is older
   *  than the threshold, the document is treated as fully decayed (normalized decay of 1).
   *   - Increasing this value:
   *     - Effect: Recency decay is more gradual; documents remain relevant for a longer time.
   *     - Use case: When freshness/recency is _less_ important (e.g. product reviews)
   *   - Decreasing this value:
   *     - Effect: Recency decay is more abrupt; documents lose relevance faster.
   *     - Use case: When freshness/recency is _more_ important (e.g. news articles).
   * - decayWeight (default 0.5): The magnitude of the decay's impact on document scores.
   *   - Increasing this value:
   *     - Effect: Decay has a stronger impact on document scores; older docs are heavily penalized.
   *     - Use case: You want to more strongly prioritize recency.
   *   - Decreasing this value:
   *     - Effect: Decay has a weaker impact on document scores; older documents have a better chance at
   *  retaining their original score/ranking.
   *     - Use case: You want to prioritize recency less.
   *
   * @param response - The original response object from the /embed endpoint.
   * @param options - The original options object passed to the /embed endpoint.
   * */
  addAdditiveDecay(
    response: RerankResult,
    options: RerankOptions
  ): RerankResult {
    if (options.rankFields) {
      options.rankFields = ['timestamp'];
    }

    const convertDaysToSeconds = (decayThreshold: number) => {
      return decayThreshold * 24 * 60 * 60;
    };

    const {
      decayThreshold = convertDaysToSeconds(30),
      decayWeight = 0.5,
      ...previousOptions
    } = options;

    for (const doc of response.data) {
      if (doc.document && doc.document['timestamp']) {
        // Convert timestamp (e.g. "2013-09-05 15:34:00") to milliseconds
        const timestamp = new Date(doc.document['timestamp']).getTime();
        console.log('timestamp', timestamp);
        if (isNaN(timestamp)) {
          throw new Error(`Invalid date format: ${doc.document['timestamp']}`);
        }

        const now = new Date().getTime(); // Calculate current time (ms)

        // Calculate time decay in seconds (more manageable than ms)
        const decay = (now - timestamp) / 1000;

        // Normalize decay by n-days (s); docs > threshold have same decay so ancient docs don't get penalized more
        const normalizedDecay = Math.min(decay / decayThreshold, 1); // Cap at 1 for documents > decayThreshold

        // Apply decay to the original score, scaling new score to a manageable range; ^ decayWeight, ^ impact decay
        // has on ranking
        doc.score = doc.score - normalizedDecay * decayWeight; // Additive part is here
      } else {
        throw new Error(
          `Document ${doc.index} does not have a \`timestamp\` field`
        );
      }
    }
    // Reorder response.data according to new scores
    response.data.sort((a, b) => b.score - a.score);

    return response;
  }

  /** Rerank documents against a query with a reranking model. Each document is ranked in descending relevance order
   *  against the query provided.
   *
   *  Note: by default, the ['text'] field of each document is used for ranking; you can overwrite this default
   *  behavior by passing an {@link RerankOptions} `options` object specifying 1+ other fields.
   *
   *  @example
   *  ```typescript
   *  import { Pinecone } from '@pinecone-database/pinecone';
   *
   *  const pc = new Pinecone();
   *  const rerankingModel = "bge-reranker-v2-m3";
   *  const myQuery = "What are some good Turkey dishes for Thanksgiving?";
   *  const myDocuments = [
   *  { text: "I love turkey sandwiches with pastrami" },
   *  { text: "A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main" },
   *  { text: "My favorite Thanksgiving dish is pumpkin pie" },
   *  { text: "Turkey is a great source of protein" },
   *  ];
   *
   *  // >>> Sample without passing an `options` object:
   *  const response = await pc.inference.rerank(rerankingModel, myQuery, myDocuments);
   *  console.log(response);
   *  // {
   *  // model: 'bge-reranker-v2-m3',
   *  // data: [
   *  //   { index: 1, score: 0.5633179, document: [Object] },
   *  //   { index: 2, score: 0.02013874, document: [Object] },
   *  //   { index: 3, score: 0.00035419367, document: [Object] },
   *  //   { index: 0, score: 0.00021485926, document: [Object] }
   *  // ],
   *  // usage: { rerankUnits: 1 }
   *  // }
   *
   *
   *  // >>> Sample with an `options` object:
   *  const rerankOptions = {
   *     topN: 3,
   *     returnDocuments: false
   * }
   *  const response = await pc.inference.rerank(rerankingModel, myQuery, myDocuments, rerankOptions);
   *  console.log(response);
   *  // {
   *  // model: 'bge-reranker-v2-m3',
   *  // data: [
   *  //   { index: 1, score: 0.5633179, document: undefined },
   *  //   { index: 2, score: 0.02013874, document: undefined },
   *  //   { index: 3, score: 0.00035419367, document: undefined },
   *  // ],
   *  // usage: { rerankUnits: 1 }
   *  //}
   *  ```
   *
   * @param model - (Required) The model to use for reranking. Currently, the only available model is "[bge-reranker-v2-m3](https://docs.pinecone.io/models/bge-reranker-v2-m3)"}.
   * @param query - (Required) The query to rerank documents against.
   * @param documents - (Required) The documents to rerank. Each document must be either a string or an object
   * with (at minimum) a `text` key.
   * @param options - (Optional) Additional options to send with the core reranking request. Options include: how many
   * results to return, whether to return the documents in the response, alternative fields by which the model
   * should to rank the documents, and additional model-specific parameters. See {@link RerankOptions} for more details.
   * */
  @prerelease('2024-10')
  async rerank(
    model: string,
    query: string,
    documents: Array<{ [key: string]: string } | string>,
    options: RerankOptions = {}
  ): Promise<RerankResult> {
    if (documents.length == 0) {
      throw new PineconeArgumentError(
        'You must pass at least one document to rerank'
      );
    }
    if (query.length == 0) {
      throw new PineconeArgumentError('You must pass a query to rerank');
    }
    if (model.length == 0) {
      throw new PineconeArgumentError(
        'You must pass the name of a supported reranking model in order to rerank' +
          ' documents. See https://docs.pinecone.io/models for supported models.'
      );
    }
    // Destructure `options` with defaults
    // Note: If the user passes in key:value pairs in `options` that are not the following, they are ignored
    const {
      topN = documents.length,
      returnDocuments = true,
      rankFields = ['text'],
      parameters = {},
    } = options;

    // Allow documents to be passed a list of strings, or a list of objs w/at least a `text` key:
    let newDocuments: Array<{ [key: string]: string }> = [];
    if (typeof documents[0] === 'object' && !('text' in documents[0])) {
      throw new PineconeArgumentError(
        '`documents` can only be a list of strings or a list of objects with at least a `text` key, followed by a' +
          ' string value'
      );
    } else if (typeof documents[0] === 'string') {
      newDocuments = documents.map((doc) => {
        return { text: doc as string };
      });
    } else {
      newDocuments = documents as Array<{ [key: string]: string }>;
    }

    // Ensure all rankFields, if passed, are present in each document
    if (rankFields.length > 0) {
      newDocuments.forEach((doc, index) => {
        rankFields.forEach((field) => {
          if (!(field in doc)) {
            throw new PineconeArgumentError(
              `The \`rankField\` value you passed ("${field}") is missing in the document at index ${index}`
            );
          }
        });
      });
    }

    const req = {
      rerankRequest: {
        model: model,
        query: query,
        documents: newDocuments,
        topN: topN,
        returnDocuments: returnDocuments,
        rankFields: rankFields,
        parameters: parameters,
      },
    };

    const response = await this._inferenceApi.rerank(req);

    if (options.decay) {
      return this.addAdditiveDecay(response, options);
    }

    return response;
  }
}
