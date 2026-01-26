import { PineconeArgumentError } from '../../errors';
import {
  InferenceApi,
  RerankOperationRequest,
  RerankResult,
} from '../../pinecone-generated-ts-fetch/inference';
import { rerank } from '../rerank';

const rerankModel = 'test-model';
const myQuery = 'test-query';

const setupRerankResponse = (response = {}, isSuccess = true) => {
  const fakeRerank: (req: RerankOperationRequest) => Promise<RerankResult> =
    jest
      .fn()
      .mockImplementation(() =>
        isSuccess ? Promise.resolve(response) : Promise.reject(response),
      );
  const IA = { rerank: fakeRerank } as InferenceApi;
  return IA;
};

describe('rerank', () => {
  test('Confirm throws error if no documents are passed', async () => {
    const IA = setupRerankResponse();
    const rerankCmd = rerank(IA);
    await expect(rerankCmd(rerankModel, myQuery, [], {})).rejects.toThrow(
      new PineconeArgumentError(
        'You must pass at least one document to rerank',
      ),
    );
  });

  test('Confirm docs as list of strings is converted to list of objects with `text` key', async () => {
    const myDocuments = ['doc1', 'doc2'];
    const expectedDocuments = [{ text: 'doc1' }, { text: 'doc2' }];

    const IA = setupRerankResponse({
      model: 'some-model',
      data: [{}],
      usage: { rerankUnits: 1 },
    });
    await rerank(IA)(rerankModel, myQuery, myDocuments, {});

    const expectedReq = {
      model: rerankModel,
      query: myQuery,
      documents: expectedDocuments,
      parameters: {},
      rankFields: ['text'],
      returnDocuments: true,
      topN: 2,
    };
    expect(IA.rerank).toHaveBeenCalledWith(
      expect.objectContaining({ rerankRequest: expectedReq }),
    );
  });

  test('Confirm provided rankFields override default `text` field for reranking', async () => {
    const myDocuments = [
      { text: 'doc1', title: 'title1' },
      { text: 'doc2', title: 'title2' },
    ];
    const rankFields = ['title'];

    const IA = setupRerankResponse({ rerankResponse: {} });
    await rerank(IA)(rerankModel, myQuery, myDocuments, {
      rankFields,
    });

    const expectedReq = {
      model: rerankModel,
      query: myQuery,
      documents: myDocuments,
      rankFields,
      parameters: {},
      returnDocuments: true,
      topN: 2,
    };
    expect(IA.rerank).toHaveBeenCalledWith(
      expect.objectContaining({ rerankRequest: expectedReq }),
    );
  });

  test('Confirm error thrown if query is missing', async () => {
    const myQuery = '';
    const myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
    const IA = setupRerankResponse();
    const rerankCmd = rerank(IA);
    await expect(
      rerankCmd(rerankModel, myQuery, myDocuments, {}),
    ).rejects.toThrow(
      new PineconeArgumentError('You must pass a query to rerank'),
    );
  });

  test('Confirm error thrown if model is missing', async () => {
    const rerankModel = '';
    const myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
    const IA = setupRerankResponse();
    const rerankCmd = rerank(IA);
    await expect(
      rerankCmd(rerankModel, myQuery, myDocuments, {}),
    ).rejects.toThrow(
      new PineconeArgumentError(
        'You must pass the name of a supported reranking model in order to rerank' +
          ' documents. See https://docs.pinecone.io/models for supported models.',
      ),
    );
  });
});
