import {
  ModelInfoList,
  InferenceApi,
  ListModelsTypeEnum,
  ListModelsVectorTypeEnum,
} from '../pinecone-generated-ts-fetch/inference';

export interface ListModelsOptions {
  type?: ListModelsTypeEnum;
  vectorType?: ListModelsVectorTypeEnum;
}

export const listModels = (infApi: InferenceApi) => {
  return async (options?: ListModelsOptions): Promise<ModelInfoList> => {
    return await infApi.listModels(options);
  };
};
