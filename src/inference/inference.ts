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

/**
 * Inference generates embeddings and reranks documents using hosted models.
 *
 * Access it through `pc.inference`; do not construct it directly.
 * Unlike index search, inference works on text you supply without querying an index.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const models = await pc.inference.listModels();
 * console.log(models.models);
 * ```
 */
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

  /** @internal */
  constructor(config: PineconeConfiguration) {
    this.config = config;
    const inferenceApi = inferenceOperationsBuilder(this.config);
    this._embed = embed(inferenceApi);
    this._rerank = rerank(inferenceApi);
    this._listModels = listModels(inferenceApi);
    this._getModel = getModel(inferenceApi);
  }

  /**
   * Generates embeddings for input text using a hosted model.
   *
   * @param options - The model, input text, and model-specific parameters.
   * @returns Embeddings in input order, with the model, vector type, and token usage.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const embeddings = await pc.inference.embed({
   *   model: 'multilingual-e5-large',
   *   inputs: ['How do I return an order?'],
   *   parameters: { inputType: 'query', truncate: 'END' },
   * });
   * console.log(embeddings.data);
   * ```
   *
   * @see {@link Inference.getModel} for supported model parameters.
   */
  embed(options: EmbedOptions): Promise<EmbeddingsList> {
    return this._embed(options);
  }

  /**
   * Ranks documents by relevance to a query.
   *
   * @param options - The model, query, documents, and optional result and ranking settings.
   * @returns Results in descending relevance order, with original document indexes and relevance scores.
   * @throws {@link Errors.PineconeArgumentError} if the model, query, documents, or required document text are missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.inference.rerank({
   *   model: 'bge-reranker-v2-m3',
   *   query: 'How do I return an order?',
   *   documents: ['Start a return from your order history.', 'Orders ship on weekdays.'],
   * });
   * console.log(result.data);
   * ```
   *
   * @see {@link Inference.getModel} for supported model parameters.
   */
  async rerank(options: RerankOptions): Promise<RerankResult> {
    return this._rerank(options);
  }

  /**
   * Lists hosted models and their supported capabilities.
   *
   * @param options - Optional model and vector type filters; omit to list all models.
   * @returns Model descriptions and supported parameters in `models`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.inference.listModels({ type: 'embed', vectorType: 'dense' });
   * console.log(result.models);
   * ```
   *
   * @see {@link Inference.getModel} for details of one model.
   */
  async listModels(options?: ListModelsOptions): Promise<ModelInfoList> {
    return this._listModels(options);
  }

  /**
   * Describes a hosted model and its supported parameters.
   *
   * @param modelName - A model name returned by {@link Inference.listModels}.
   * @returns The model description, capabilities, and supported parameters.
   * @throws {@link Errors.PineconeArgumentError} if `modelName` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const model = await pc.inference.getModel('multilingual-e5-large');
   * console.log(model.supportedParameters);
   * ```
   *
   * @see {@link Inference.listModels} to discover available models.
   */
  async getModel(modelName: string): Promise<ModelInfo> {
    return this._getModel(modelName);
  }
}
