import { PineconeArgumentError } from '../errors';
import {
  ModelInfo,
  InferenceApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/inference';

export const getModel = (infApi: InferenceApi) => {
  return async (modelName: string): Promise<ModelInfo> => {
    if (!modelName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `modelName` in order to get a model',
      );
    }
    return await infApi.getModel({
      modelName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
