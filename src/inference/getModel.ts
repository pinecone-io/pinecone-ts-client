import { PineconeArgumentError } from '../errors';
import {
  ModelInfo,
  InferenceApi,
  X_PINECONE_API_VERSION,
} from '../pinecone-generated-ts-fetch/inference';
import { RetryOnServerFailure } from '../utils';

export const getModel = (infApi: InferenceApi) => {
  return async (modelName: string, maxRetries?: number): Promise<ModelInfo> => {
    if (!modelName) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `modelName` in order to get a model'
      );
    }
    const retryWrapper = new RetryOnServerFailure(
      infApi.getModel.bind(infApi),
      maxRetries
    );
    return await retryWrapper.execute({
      modelName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
