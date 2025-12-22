import { PineconeArgumentError } from '../errors';
import {
  ModelInfo,
  InferenceApi,
  GetModelRequest,
} from '../pinecone-generated-ts-fetch/inference';
import { withInferenceApiVersion } from './apiVersion';

export const getModel = (infApi: InferenceApi) => {
  return async (modelName: string): Promise<ModelInfo> => {
    if (!modelName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `modelName` in order to get a model'
      );
    }
    return await infApi.getModel(
      withInferenceApiVersion<GetModelRequest>({ modelName })
    );
  };
};
