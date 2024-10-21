import {
  EmbedOperationRequest,
  EmbedRequestInputsInner,
  InferenceApi,
  RerankResult,
} from '../pinecone-generated-ts-fetch/inference';
import { EmbeddingsList } from '../models';
import { PineconeArgumentError } from '../errors';

/** Options one can send with a request to {@link rerank} *
 *
 * @param topN - The number of documents to return in the response. Default is the number of documents passed in the
 * request.
 * @param returnDocuments - Whether to return the documents in the response. Default is `true`.
 * @param rankFields - The fields by which to rank the documents. If no field is passed, default is `['text']`.
 * Note: some models only support 1 reranking field. See the [model documentation](https://docs.pinecone.io/guides/inference/understanding-inference#rerank) for more information.
 * @param parameters - Additional model-specific parameters to send with the request, e.g. {truncate: "END"}.
 * */
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

  /* Generate embeddings for a list of input strings using a specified embedding model. */
  async embed(
    model: string,
    inputs: Array<string>,
    params: Record<string, string>
  ): Promise<EmbeddingsList> {
    const typedAndFormattedInputs: Array<EmbedRequestInputsInner> =
      this._formatInputs(inputs);
    const typedRequest: EmbedOperationRequest = {
      embedRequest: {
        model: model,
        inputs: typedAndFormattedInputs,
        parameters: params,
      },
    };
    const response = await this._inferenceApi.embed(typedRequest);
    return new EmbeddingsList(response.model, response.data, response.usage);
  }

  /** Rerank documents against a query with a reranking model. Each document is ranked in descending relevance order
   *  against the query provided.
   *
   *  @example
   *  ````typescript
   *  import { Pinecone } from '@pinecone-database/pinecone';
   *  const pc = new Pinecone();
   *  const rerankingModel = 'bge-reranker-v2-m3';
   *  const myQuery = 'What are some good Turkey dishes for Thanksgiving?';
   *
   *  // Option 1: Documents as an array of strings
   *  const myDocsStrings = [
   *    'I love turkey sandwiches with pastrami',
   *    'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
   *    'My favorite Thanksgiving dish is pumpkin pie',
   *    'Turkey is a great source of protein',
   *  ];
   *
   *  // Option 1 response
   *  const response = await pc.inference.rerank(
   *    rerankingModel,
   *    myQuery,
   *    myDocsStrings
   *  );
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
   *  // Option 2: Documents as an array of objects
   *  const myDocsObjs = [
   *    {
   *      title: 'Turkey Sandwiches',
   *      body: 'I love turkey sandwiches with pastrami',
   *    },
   *    {
   *      title: 'Lemon Turkey',
   *      body: 'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
   *    },
   *    {
   *      title: 'Thanksgiving',
   *      body: 'My favorite Thanksgiving dish is pumpkin pie',
   *    },
   *    { title: 'Protein Sources', body: 'Turkey is a great source of protein' },
   *  ];
   *
   *  // Option 2: Options object declaring which custom key to rerank on
   *  // Note: If no custom key is passed via `rankFields`, each doc must contain a `text` key, and that will act as
   *   the default)
   *  const rerankOptions = {
   *    topN: 3,
   *    returnDocuments: false,
   *    rankFields: ['body'],
   *    parameters: {
   *      inputType: 'passage',
   *      truncate: 'END',
   *    },
   *  };
   *
   *  // Option 2 response
   *  const response = await pc.inference.rerank(
   *    rerankingModel,
   *    myQuery,
   *    myDocsObjs,
   *    rerankOptions
   *  );
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
   * ```
   *
   * @param model - (Required) The model to use for reranking. Currently, the only available model is "[bge-reranker-v2-m3](https://docs.pinecone.io/models/bge-reranker-v2-m3)"}.
   * @param query - (Required) The query to rerank documents against.
   * @param documents - (Required) An array of documents to rerank. The array can either be an array of strings or
   * an array of objects.
   * @param options - (Optional) Additional options to send with the reranking request. See {@link RerankOptions} for more details.
   * */
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
    } = options;

    let { rankFields = ['text'] } = options;

    // Validate and standardize documents to ensure they are in object format
    const newDocuments = documents.map((doc) =>
      typeof doc === 'string' ? { text: doc } : doc
    );

    if (!options.rankFields) {
      if (!newDocuments.every((doc) => typeof doc === 'object' && doc.text)) {
        throw new PineconeArgumentError(
          'Documents must be a list of strings or objects containing the "text" field'
        );
      }
    }

    if (options.rankFields) {
      rankFields = options.rankFields;
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

    return await this._inferenceApi.rerank(req);
  }
}
