import {
  ModelInfoList,
  InferenceApi,
  ListModelsRequest,
} from '../pinecone-generated-ts-fetch/inference';
import { withInferenceApiVersion } from './apiVersion';

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
    return await infApi.listModels(
      withInferenceApiVersion<ListModelsRequest>(options || {})
    );
  };
};
