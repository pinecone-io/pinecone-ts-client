import {
  EmbeddingsList,
  RerankResult,
} from '../pinecone-generated-ts-fetch/inference';
import { inferenceOperationsBuilder } from './inferenceOperationsBuilder';
import { PineconeConfiguration } from '../data';
import type { EmbedOptions } from './embed';
import { embed } from './embed';
import type { RerankOptions } from './rerank';
import { rerank } from './rerank';

/* This class is the class through which users interact with Pinecone's inference API.  */
export class Inference {
  /** @hidden */
  _embed: ReturnType<typeof embed>;
  /** @hidden */
  _rerank: ReturnType<typeof rerank>;
  /** @internal */
  config: PineconeConfiguration;

  constructor(config: PineconeConfiguration) {
    this.config = config;
    const inferenceApi = inferenceOperationsBuilder(this.config);
    this._embed = embed(inferenceApi);
    this._rerank = rerank(inferenceApi);
  }

  embed(options: EmbedOptions): Promise<EmbeddingsList> {
    return this._embed(options);
  }

  /** Rerank documents against a query with a reranking model. Each document is ranked in descending relevance order
   *  against the query provided.
   *
   *  @example
   *  ````typescript
   *  import { Pinecone } from '@pinecone-database/pinecone';
   *  const pc = new Pinecone();
   *  const rerankingModel = 'bge-reranker-v2-m3';
   *  const myQuery = 'What are some good Turkey dishes for Thanksgiving?';
   *
   *  // Option 1: Documents as an array of strings
   *  const myDocsStrings = [
   *    'I love turkey sandwiches with pastrami',
   *    'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
   *    'My favorite Thanksgiving dish is pumpkin pie',
   *    'Turkey is a great source of protein',
   *  ];
   *
   *  // Option 1 response
   *  const response = await pc.inference.rerank(
   *    rerankingModel,
   *    myQuery,
   *    myDocsStrings
   *  );
   *  console.log(response);
   *  // {
   *  // model: 'bge-reranker-v2-m3',
   *  // data: [
   *  //   { index: 1, score: 0.5633179, document: [Object] },
   *  //   { index: 2, score: 0.02013874, document: [Object] },
   *  //   { index: 3, score: 0.00035419367, document: [Object] },
   *  //   { index: 0, score: 0.00021485926, document: [Object] }
   *  // ],
   *  // usage: { rerankUnits: 1 }
   *  // }
   *
   *  // Option 2: Documents as an array of objects
   *  const myDocsObjs = [
   *    {
   *      title: 'Turkey Sandwiches',
   *      body: 'I love turkey sandwiches with pastrami',
   *    },
   *    {
   *      title: 'Lemon Turkey',
   *      body: 'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
   *    },
   *    {
   *      title: 'Thanksgiving',
   *      body: 'My favorite Thanksgiving dish is pumpkin pie',
   *    },
   *    { title: 'Protein Sources', body: 'Turkey is a great source of protein' },
   *  ];
   *
   *  // Option 2: Options object declaring which custom key to rerank on
   *  // Note: If no custom key is passed via `rankFields`, each doc must contain a `text` key, and that will act as
   *   the default)
   *  const rerankOptions = {
   *    topN: 3,
   *    returnDocuments: false,
   *    rankFields: ['body'],
   *    parameters: {
   *      inputType: 'passage',
   *      truncate: 'END',
   *    },
   *  };
   *
   *  // Option 2 response
   *  const response = await pc.inference.rerank(
   *    rerankingModel,
   *    myQuery,
   *    myDocsObjs,
   *    rerankOptions
   *  );
   *  console.log(response);
   *  // {
   *  // model: 'bge-reranker-v2-m3',
   *  // data: [
   *  //   { index: 1, score: 0.5633179, document: undefined },
   *  //   { index: 2, score: 0.02013874, document: undefined },
   *  //   { index: 3, score: 0.00035419367, document: undefined },
   *  // ],
   *  // usage: { rerankUnits: 1 }
   *  //}
   * ```
   *
   * @param model - (Required) The model to use for reranking. Currently, the only available model is "[bge-reranker-v2-m3](https://docs.pinecone.io/models/bge-reranker-v2-m3)"}.
   * @param query - (Required) The query to rerank documents against.
   * @param documents - (Required) An array of documents to rerank. The array can either be an array of strings or
   * an array of objects.
   * @param options - (Optional) Additional options to send with the reranking request. See {@link RerankOptions} for more details.
   * */
  async rerank(
    model: string,
    query: string,
    documents: Array<{ [key: string]: string } | string>,
    options: RerankOptions = {}
  ): Promise<RerankResult> {
    return this._rerank(model, query, documents, options);
  }
}
