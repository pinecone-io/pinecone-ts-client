import {
  EmbedOperationRequest,
  EmbedRequestInputsInner,
  EmbedRequestParameters,
  InferenceApi,
  Rerank200Response as RerankResult,
} from '../pinecone-generated-ts-fetch/inference';
import { EmbeddingsList } from '../models';
import { PineconeArgumentError } from '../errors';

interface RerankOptions {
  topN?: number;
  returnDocuments?: boolean;
  rankFields?: Array<string>;
  parameters?: { [key: string]: string };
}

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
        parameters: typedParams,
      },
    };
    const response = await this._inferenceApi.embed(typedRequest);
    return new EmbeddingsList(response.model, response.data, response.usage);
  }

  // todo: docstring
  async rerank(
    model: string,
    query: string,
    documents: Array<{ [key: string]: string } | string>,
    options: RerankOptions = {}
  ): Promise<RerankResult> {
    // Destructure `options` with defaults
    const {
      topN = documents.length,
      returnDocuments = true,
      rankFields = ['text'],
      parameters = {},
    } = options;

    // Allow documents to be passed a list of strings, or a list of dicts w/at least a `text` key:
    let newDocuments: Array<{ [key: string]: string }> = [];
    if (typeof documents[0] === 'object' && !('text' in documents[0])) {
      throw new PineconeArgumentError(
        '`documents` can only be a list of strings or a list of dictionaries with at least a `text` key, followed by a string value'
      );
    } else if (typeof documents[0] === 'string') {
      newDocuments = documents.map((doc) => {
        return { text: doc as string };
      });
    } else {
      newDocuments = documents as Array<{ [key: string]: string }>;
    }

    // Ensure all rankFields, if passed, are present in each document
    if (rankFields.length > 0) {
      newDocuments.forEach((doc, index) => {
        rankFields.forEach((field) => {
          if (!(field in doc)) {
            throw new PineconeArgumentError(
              `The \`rankField\` value you passed ("${field}") is missing in the document at index ${index}`
            );
          }
        });
      });
    }

    const req = {
      rerankRequest: {
        model: model,
        query: query,
        documents: newDocuments,
        topN: topN,
        returnDocuments: returnDocuments,
        rankFields: rankFields,
        parameters: parameters,
      },
    };

    return (await this._inferenceApi.rerank(req)) as RerankResult;
  }
}

// todo: add feature flag from bulk import PR here when that PR's merged
