import {
  EmbedOperationRequest,
  EmbedRequestInputsInner,
  EmbedRequestParameters,
  InferenceApi,
} from '../pinecone-generated-ts-fetch';
import { EmbeddingsList } from '../models';

/* This class is the class through which users interact with Pinecone's inference API.  */
export class Inference {
  _inferenceApi: InferenceApi;

  constructor(inferenceApi: InferenceApi) {
    this._inferenceApi = inferenceApi;
  }

  /* Format the input data into the correct format for the Inference API request. */
  public _formatInputs(data: Array<string>): Array<EmbedRequestInputsInner> {
    return data.map((str) => {
      return { text: str };
    });
  }

  /* Format the parameters object into the correct format for the Inference API request. */
  public _formatParams(
    parameters: Record<string, string>
  ): EmbedRequestParameters {
    return parameters;
  }

  /* Generate embeddings for a list of input strings using a specified embedding model. */
  async embed(
    model: string,
    inputs: Array<string>,
    params: Record<string, string>
  ): Promise<EmbeddingsList> {
    try {
      const typedAndFormattedInputs: Array<EmbedRequestInputsInner> =
        this._formatInputs(inputs);
      const typedParams: EmbedRequestParameters = this._formatParams(params);
      const typedRequest: EmbedOperationRequest = {
        embedRequest: {
          model: model,
          inputs: typedAndFormattedInputs,
          parameters: typedParams,
        },
      };
      const response = await this._inferenceApi.embed(typedRequest);
      if (response.model && response.data && response.usage) {
        return new EmbeddingsList(
          response.model,
          response.data,
          response.usage
        );
      } else {
        console.log(
          'Response from Inference API is missing required fields; response:',
          response
        );
        throw new Error(
          'Response from Inference API is missing required fields'
        );
      }
    } catch (error) {
      console.log('Error occurred while generating embeddings:', error);
      throw error;
    }
  }
}
