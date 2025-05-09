import {
  RerankResult,
  InferenceApi,
} from '../pinecone-generated-ts-fetch/inference';
import { PineconeArgumentError } from '../errors';

/** Options one can send with a request to {@link rerank} *
 *
 * @param topN - The number of documents to return in the response. Default is the number of documents passed in the
 * request.
 * @param returnDocuments - Whether to return the documents in the response. Default is `true`.
 * @param rankFields - The fields by which to rank the documents. If no field is passed, default is `['text']`.
 * Note: some models only support 1 reranking field. See the [model documentation](https://docs.pinecone.io/guides/inference/understanding-inference#rerank) for more information.
 * @param parameters - Additional model-specific parameters to send with the request, e.g. {truncate: "END"}.
 * */
export interface RerankOptions {
  topN?: number;
  returnDocuments?: boolean;
  rankFields?: Array<string>;
  parameters?: { [key: string]: string };
}

export const rerank = (infApi: InferenceApi) => {
  return async (
    model: string,
    query: string,
    documents: Array<{ [key: string]: string } | string>,
    options: RerankOptions = {}
  ): Promise<RerankResult> => {
    if (documents.length == 0) {
      throw new PineconeArgumentError(
        'You must pass at least one document to rerank'
      );
    }
    if (query.length == 0) {
      throw new PineconeArgumentError('You must pass a query to rerank');
    }
    if (model.length == 0) {
      throw new PineconeArgumentError(
        'You must pass the name of a supported reranking model in order to rerank' +
          ' documents. See https://docs.pinecone.io/models for supported models.'
      );
    }

    const {
      topN = documents.length,
      returnDocuments = true,
      parameters = {},
    } = options;

    let { rankFields = ['text'] } = options;

    // Validate and standardize documents to ensure they are in object format
    const newDocuments = documents.map((doc) =>
      typeof doc === 'string' ? { text: doc } : doc
    );

    if (!options.rankFields) {
      if (!newDocuments.every((doc) => typeof doc === 'object' && doc.text)) {
        throw new PineconeArgumentError(
          'Documents must be a list of strings or objects containing the "text" field'
        );
      }
    }

    if (options.rankFields) {
      rankFields = options.rankFields;
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

    return await infApi.rerank(req);
  };
};
