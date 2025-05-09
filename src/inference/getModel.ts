import {
  ModelInfo,
  InferenceApi,
} from '../pinecone-generated-ts-fetch/inference';

export const getModel = (infApi: InferenceApi) => {
  return async (modelName: string): Promise<ModelInfo> => {
    if (!modelName) {
      throw new Error(
        'You must pass a non-empty string for `modelName` in order to get a model'
      );
    }
    return await infApi.getModel({ modelName });
  };
};
