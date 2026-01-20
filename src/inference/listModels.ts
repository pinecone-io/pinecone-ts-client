import {
  ModelInfoList,
  InferenceApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/inference';
import { RetryOnServerFailure } from '../utils';

/**
 * The options for listing models.
 */
export interface ListModelsOptions {
  /**
   * Filter to limit the models returned. ('embed' or 'rerank')
   */
  type?: string;
  /**
   * Filter embedding models by vector type ('dense' or 'sparse'). Only relevant when type is 'embed'.
   */
  vectorType?: string;
}

export const listModels = (infApi: InferenceApi) => {
  return async (
    options?: ListModelsOptions,
    maxRetries?: number
  ): Promise<ModelInfoList> => {
    const retryWrapper = new RetryOnServerFailure(
      infApi.listModels.bind(infApi),
      maxRetries
    );

    return await retryWrapper.execute({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
