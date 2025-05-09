import {
  EmbeddingsList,
  EmbedOperationRequest,
  EmbedRequestInputsInner,
  InferenceApi,
} from '../pinecone-generated-ts-fetch/inference';

export const embed = (infApi: InferenceApi) => {
  return async (
    model: string,
    inputs: Array<string>,
    params?: Record<string, string>
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

    const typedRequest: EmbedOperationRequest = {
      embedRequest: {
        model: model,
        inputs: typedAndFormattedInputs,
        parameters: params,
      },
    };
    return await infApi.embed(typedRequest);
  };
};
