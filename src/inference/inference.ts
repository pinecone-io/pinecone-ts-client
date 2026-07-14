import {
  EmbeddingsList,
  ModelInfo,
  ModelInfoList,
  RerankResult,
} from '../pinecone-generated-ts-fetch/inference';
import { inferenceOperationsBuilder } from './inferenceOperationsBuilder';
import { PineconeConfiguration } from '../data';
import { embed, EmbedOptions } from './embed';
import type { RerankOptions } from './rerank';
import { rerank } from './rerank';
import { getModel } from './getModel';
import { listModels, ListModelsOptions } from './listModels';

/* The Inference class uses the Inference API to generate embeddings, rerank documents, and work with models.  */
export class Inference {
  /** @hidden */
  _embed: ReturnType<typeof embed>;
  /** @hidden */
  _rerank: ReturnType<typeof rerank>;
  /** @hidden */
  _listModels: ReturnType<typeof listModels>;
  /** @hidden */
  _getModel: ReturnType<typeof getModel>;
  /** @internal */
  config: PineconeConfiguration;

  constructor(config: PineconeConfiguration) {
    this.config = config;
    const inferenceApi = inferenceOperationsBuilder(this.config);
    this._embed = embed(inferenceApi);
    this._rerank = rerank(inferenceApi);
    this._listModels = listModels(inferenceApi);
    this._getModel = getModel(inferenceApi);
  }

  /**
   * Generates embeddings for the provided inputs using the specified model and (optional) parameters.
   *
   * @example
   * ````typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const embeddings = await pc.inference.embed({
   *   model: 'multilingual-e5-large',
   *   inputs: ['Who created the first computer?'],
   *   parameters: {
   *     inputType: 'passage',
   *     truncate: 'END',
   *   }
   * });
   * console.log(embeddings);
   * // {
   * //   model: 'multilingual-e5-large',
   * //   vectorType: 'dense',
   * //   data: [ { values: [Array], vectorType: 'dense' } ],
   * //   usage: { totalTokens: 10 }
   * // }
   * ```
   *
   * @param options - The {@link EmbedOptions} for generating embeddings.
   * @returns A promise that resolves to {@link EmbeddingsList}.
   * */
  embed(options: EmbedOptions): Promise<EmbeddingsList> {
    return this._embed(options);
  }

  /**
   * Rerank documents against a query with a reranking model. Each document is ranked in descending relevance order
   * against the query provided.
   *
   * @example
   * ````typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const myQuery = 'What are some good Turkey dishes for Thanksgiving?';
   *
   * // Option 1: Documents as an array of strings
   * const myDocsStrings = [
   *   'I love turkey sandwiches with pastrami',
   *   'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
   *   'My favorite Thanksgiving dish is pumpkin pie',
   *   'Turkey is a great source of protein',
   * ];
   *
   * // Option 1 response
   * const response = await pc.inference.rerank({
   *   model: 'bge-reranker-v2-m3',
   *   query: myQuery,
   *   documents: myDocsStrings
   * });
   * console.log(response);
   * // {
   * // model: 'bge-reranker-v2-m3',
   * // data: [
   * //   { index: 1, score: 0.5633179, document: [Object] },
   * //   { index: 2, score: 0.02013874, document: [Object] },
   * //   { index: 3, score: 0.00035419367, document: [Object] },
   * //   { index: 0, score: 0.00021485926, document: [Object] }
   * // ],
   * // usage: { rerankUnits: 1 }
   * // }
   *
   * // Option 2: Documents as an array of objects
   * const myDocsObjs = [
   *   {
   *     title: 'Turkey Sandwiches',
   *     body: 'I love turkey sandwiches with pastrami',
   *   },
   *   {
   *     title: 'Lemon Turkey',
   *     body: 'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
   *   },
   *   {
   *     title: 'Thanksgiving',
   *     body: 'My favorite Thanksgiving dish is pumpkin pie',
   *   },
   *   { title: 'Protein Sources', body: 'Turkey is a great source of protein' },
   * ];
   *
   * // Option 2: Options object declaring which custom key to rerank on
   * // Note: If no custom key is passed via `rankFields`, each doc must contain a `text` key, and that will act as the default)
   * const response = await pc.inference.rerank({
   *   model: 'bge-reranker-v2-m3',
   *   query: myQuery,
   *   documents: myDocsObjs,
   *   topN: 3,
   *   returnDocuments: false,
   *   rankFields: ['body'],
   *   parameters: {
   *     inputType: 'passage',
   *     truncate: 'END',
   *   },
   * });
   * console.log(response);
   * // {
   * // model: 'bge-reranker-v2-m3',
   * // data: [
   * //   { index: 1, score: 0.5633179, document: undefined },
   * //   { index: 2, score: 0.02013874, document: undefined },
   * //   { index: 3, score: 0.00035419367, document: undefined },
   * // ],
   * // usage: { rerankUnits: 1 }
   * //}
   * ```
   *
   * @param options - The {@link RerankOptions} for the reranking operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @returns A promise that resolves to {@link RerankResult}.
   * */
  async rerank(options: RerankOptions): Promise<RerankResult> {
    return this._rerank(options);
  }

  /**
   * List available models hosted by Pinecone.
   *
   * @example
   * ````typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const models = await pc.inference.listModels();
   * console.log(models);
   * // {
   * //   models: [
   * //     {
   * //       model: 'llama-text-embed-v2',
   * //       shortDescription: 'A high performance dense embedding model optimized for multilingual and cross-lingual text question-answering retrieval with support for long documents (up to 2048 tokens) and dynamic embedding size (Matryoshka Embeddings).',
   * //       type: 'embed',
   * //       vectorType: 'dense',
   * //       defaultDimension: 1024,
   * //       modality: 'text',
   * //       maxSequenceLength: 2048,
   * //       maxBatchSize: 96,
   * //       providerName: 'NVIDIA',
   * //       supportedDimensions: [Array],
   * //       supportedMetrics: [Array],
   * //       supportedParameters: [Array]
   * //     },
   * //     ...
   * //     {
   * //       model: 'pinecone-rerank-v0',
   * //       shortDescription: 'A state of the art reranking model that out-performs competitors on widely accepted benchmarks. It can handle chunks up to 512 tokens (1-2 paragraphs)',
   * //       type: 'rerank',
   * //       vectorType: undefined,
   * //       defaultDimension: undefined,
   * //       modality: 'text',
   * //       maxSequenceLength: 512,
   * //       maxBatchSize: 100,
   * //       providerName: 'Pinecone',
   * //       supportedDimensions: undefined,
   * //       supportedMetrics: undefined,
   * //       supportedParameters: [Array]
   * //     }
   * //   ]
   * // }
   * ```
   *
   * @param options - (Optional) A {@link ListModelsOptions} object to filter the models returned.
   * @returns A promise that resolves to {@link ModelInfoList}.
   * */
  async listModels(options?: ListModelsOptions): Promise<ModelInfoList> {
    return this._listModels(options);
  }

  /**
   * Get the information for a model hosted by Pinecone.
   *
   * @example
   * ````typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const model = await pc.inference.getModel('pinecone-sparse-english-v0');
   * console.log(model);
   * // {
   * //   model: 'pinecone-sparse-english-v0',
   * //   shortDescription: 'A sparse embedding model for converting text to sparse vectors for keyword or hybrid semantic/keyword search. Built on the innovations of the DeepImpact architecture.',
   * //   type: 'embed',
   * //   vectorType: 'sparse',
   * //   defaultDimension: undefined,
   * //   modality: 'text',
   * //   maxSequenceLength: 512,
   * //   maxBatchSize: 96,
   * //   providerName: 'Pinecone',
   * //   supportedDimensions: undefined,
   * //   supportedMetrics: [ 'DotProduct' ],
   * //   supportedParameters: [
   * //     {
   * //       parameter: 'input_type',
   * //       type: 'one_of',
   * //       valueType: 'string',
   * //       required: true,
   * //       allowedValues: [Array],
   * //       min: undefined,
   * //       max: undefined,
   * //       _default: undefined
   * //     },
   * //     {
   * //       parameter: 'truncate',
   * //       type: 'one_of',
   * //       valueType: 'string',
   * //       required: false,
   * //       allowedValues: [Array],
   * //       min: undefined,
   * //       max: undefined,
   * //       _default: 'END'
   * //     },
   * //     {
   * //       parameter: 'return_tokens',
   * //       type: 'any',
   * //       valueType: 'boolean',
   * //       required: false,
   * //       allowedValues: undefined,
   * //       min: undefined,
   * //       max: undefined,
   * //       _default: false
   * //     }
   * //   ]
   * // }
   * ```
   *
   * @param modelName - The model name you would like to describe.
   * @returns A promise that resolves to {@link ModelInfo}.
   * */
  async getModel(modelName: string): Promise<ModelInfo> {
    return this._getModel(modelName);
  }
}
