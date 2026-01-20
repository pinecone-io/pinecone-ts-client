import {
  EmbeddingsList,
  X_PINECONE_API_VERSION,
  EmbedRequestInputsInner,
  InferenceApi,
} from '../pinecone-generated-ts-fetch/inference';
import { RetryOnServerFailure } from '../utils';

export const embed = (infApi: InferenceApi) => {
  return async (
    model: string,
    inputs: Array<string>,
    params?: Record<string, string>,
    maxRetries?: number
  ): Promise<EmbeddingsList> => {
    const typedAndFormattedInputs: Array<EmbedRequestInputsInner> = inputs.map(
      (str) => {
        return { text: str };
      }
    );
    if (params && params.inputType) {
      // Rename `inputType` to `input_type`
      params.input_type = params.inputType;
      delete params.inputType;
    }

    const retryWrapper = new RetryOnServerFailure(
      infApi.embed.bind(infApi),
      maxRetries
    );
    return await retryWrapper.execute({
      embedRequest: {
        model: model,
        inputs: typedAndFormattedInputs,
        parameters: params,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
