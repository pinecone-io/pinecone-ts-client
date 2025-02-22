import { VectorOperationsProvider } from './vectorOperationsProvider';
import { PineconeArgumentError } from '../../errors';
import { RetryOnServerFailure } from '../../utils';
import { SearchRecordsResponse } from '../../pinecone-generated-ts-fetch/db_data';

export type SearchRecordsOptions = {
  query: SearchRecordsQuery;
  fields?: Array<string>;
  rerank?: SearchRecordsRerank;
};

export type SearchRecordsQuery = {
  topK: number;
  filter?: object;
  inputs?: object;
  vector?: SearchRecordsVector;
};

export type SearchRecordsRerank = {
  model: string;
  rankFields: Array<string>;
  topN?: number;
  parameters?: { [key: string]: any };
  query?: string;
};

export type SearchRecordsVector = {
  values?: Array<number>;
  sparseValues?: Array<number>;
  sparseIndices?: Array<number>;
};

export class SearchRecordsCommand {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (options: SearchRecordsOptions) => {
    if (!options.query) {
      throw new PineconeArgumentError(
        'You must pass a `query` object to search.'
      );
    }
  };

  async run(
    searchOptions: SearchRecordsOptions,
    maxRetries?: number
  ): Promise<SearchRecordsResponse> {
    this.validator(searchOptions);

    const api = await this.apiProvider.provide();

    const retryWrapper = new RetryOnServerFailure(
      api.searchRecordsNamespace.bind(api),
      maxRetries
    );

    return await retryWrapper.execute({
      searchRecordsRequest: searchOptions,
      namespace: this.namespace,
    });
  }
}
