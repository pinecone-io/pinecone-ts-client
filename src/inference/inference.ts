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

    const {
      topN = documents.length,
      returnDocuments = true,
      parameters = {},
      rankFields = undefined,
    } = options;

    let computedRankFields: string[];

    // If user does not pass in rankFields:
    if (!rankFields) {
      // If `documents` is an array of strings:
      if (documents.every((doc) => typeof doc === 'string')) {
        // Set rankFields to default value of 'text'
        computedRankFields = ['text'];
      } else if (
        // If`documents` is an array of objects:
        documents.every((doc) => typeof doc === 'object' && doc !== null)
      ) {
        // If there is a `text` key (other keys can be present too):
        if (
          documents.every((doc) => (doc as { [key: string]: string })['text'])
        ) {
          computedRankFields = ['text'];
        } else {
          // If there is no `text` key:
          throw new PineconeArgumentError(
            'One or more documents are missing the specified rank field: `text`'
          );
        }
      } else {
        throw new PineconeArgumentError(
          'Documents must be a list of strings or a list of objects'
        );
      }
    } else {
      computedRankFields = rankFields;
    }

    // Standardize documents to ensure they are in object format
    const newDocuments = documents.map((doc) =>
      typeof doc === 'string' ? { text: doc } : doc
    );

    const req = {
      rerankRequest: {
        model: model,
        query: query,
        documents: newDocuments,
        topN: topN,
        returnDocuments: returnDocuments,
        rankFields: computedRankFields,
        parameters: parameters,
      },
    };

    return await this._inferenceApi.rerank(req);
  }
}
