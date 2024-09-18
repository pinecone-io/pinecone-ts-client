import {
  EmbedOperationRequest,
  EmbedRequestInputsInner,
  EmbedRequestParameters,
  InferenceApi,
  Rerank200Response as RerankResult
} from '../pinecone-generated-ts-fetch/inference';
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
    const typedAndFormattedInputs: Array<EmbedRequestInputsInner> =
      this._formatInputs(inputs);
    const typedParams: EmbedRequestParameters = this._formatParams(params);
    const typedRequest: EmbedOperationRequest = {
      embedRequest: {
        model: model,
        inputs: typedAndFormattedInputs,
        parameters: typedParams
      }
    };
    const response = await this._inferenceApi.embed(typedRequest);
    return new EmbeddingsList(response.model, response.data, response.usage);
  }

  // todo: docstring
  async rerank(
    model: string,
    query: string,
    documents: Array<{[key: string]: string}>,
    topN?: number,
    returnDocuments?: boolean,
    rankFields?: Array<string>,
    parameters?: { [key: string]: string; }
  ): Promise<RerankResult> {
    // todo: Add implementation here
    return {} as RerankResult;
  }

}

// todo: add feature flag from bulk import PR here when that PR's merged
