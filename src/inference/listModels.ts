import {
  ModelInfoList,
  InferenceApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/inference';

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
  return async (options?: ListModelsOptions): Promise<ModelInfoList> => {
    return await infApi.listModels({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
