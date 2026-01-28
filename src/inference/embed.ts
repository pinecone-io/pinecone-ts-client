import {
  EmbeddingsList,
  X_PINECONE_API_VERSION,
  EmbedRequestInputsInner,
  InferenceApi,
} from '../pinecone-generated-ts-fetch/inference';

/**
 * Options for generating embeddings.
 */
export interface EmbedOptions {
  /**
   * The [model](https://docs.pinecone.io/guides/index-data/create-an-index#embedding-models) to use for embedding generation.
   */
  model: string;

  /**
   * List of inputs to generate embeddings for.
   */
  inputs: Array<string>;

  /**
   * Additional model-specific parameters. Refer to the [model guide](https://docs.pinecone.io/guides/index-data/create-an-index#embedding-models) for available model parameters.
   */
  parameters?: Record<string, string>;
}

export const embed = (infApi: InferenceApi) => {
  return async (options: EmbedOptions): Promise<EmbeddingsList> => {
    const typedAndFormattedInputs: Array<EmbedRequestInputsInner> =
      options.inputs.map((str) => {
        return { text: str };
      });
    const params = options.parameters ? { ...options.parameters } : undefined;
    if (params && params.inputType) {
      // Rename `inputType` to `input_type`
      params.input_type = params.inputType;
      delete params.inputType;
    }

    return await infApi.embed({
      embedRequest: {
        model: options.model,
        inputs: typedAndFormattedInputs,
        parameters: params,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  };
};
