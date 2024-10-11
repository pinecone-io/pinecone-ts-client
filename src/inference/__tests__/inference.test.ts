import { Inference } from '../inference';
import type { PineconeConfiguration } from '../../data';
import { inferenceOperationsBuilder } from '../inferenceOperationsBuilder';
import { PineconeArgumentError } from '../../errors';
import { RerankResult } from '../../pinecone-generated-ts-fetch/inference';

describe('Inference Class: _formatInputs', () => {
  let inference: Inference;

  beforeEach(() => {
    const config: PineconeConfiguration = { apiKey: 'test-api-key' };
    const infApi = inferenceOperationsBuilder(config);
    inference = new Inference(infApi);
  });

  it('Should format inputs correctly', () => {
    const inputs = ['input1', 'input2'];
    const expected = [{ text: 'input1' }, { text: 'input2' }];
    const result = inference._formatInputs(inputs);
    expect(result).toEqual(expected);
  });
});

describe('Inference Class: _formatParams', () => {
  let inference: Inference;

  beforeEach(() => {
    const config: PineconeConfiguration = { apiKey: 'test-api-key' };
    const infApi = inferenceOperationsBuilder(config);
    inference = new Inference(infApi);
  });

  it('Should format params correctly', () => {
    const params = { inputType: 'text', truncate: 'END' };
    const expected = { inputType: 'text', truncate: 'END' };
    const result = inference._formatParams(params);
    expect(result).toEqual(expected);
  });
});

describe('Inference Class: embed', () => {
  let inference: Inference;

  beforeEach(() => {
    const config: PineconeConfiguration = { apiKey: 'test-api-key' };
    const infApi = inferenceOperationsBuilder(config);
    inference = new Inference(infApi);
  });

  it('Should throw error if response is missing required fields', async () => {
    const model = 'test-model';
    const inputs = ['input1', 'input2'];
    const params = { inputType: 'text', truncate: 'END' };

    const mockedIncorrectResponse = { model: 'test-model' };
    const expectedError = Error(
      'Response from Inference API is missing required fields'
    );
    const embed = jest.spyOn(inference._inferenceApi, 'embed');
    // @ts-ignore
    embed.mockResolvedValue(mockedIncorrectResponse);

    try {
      await inference.embed(model, inputs, params);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });
});

describe('Inference Class: rerank', () => {
  let inference: Inference;

  beforeEach(() => {
    const config: PineconeConfiguration = { apiKey: 'test-api-key' };
    const infApi = inferenceOperationsBuilder(config);
    inference = new Inference(infApi);
  });

  test('Throws error if no documents are passed', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const expectedError = new PineconeArgumentError(
      'You must pass at least one document to rerank'
    );
    try {
      await inference.rerank(rerankingModel, myQuery, []);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  test('Confirm custom field is used for ranking if provided', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [{ someField: 'doc1' }, { someField: 'doc2' }];

    const expectedReq = {
      model: rerankingModel,
      query: myQuery,
      documents: myDocuments,
      parameters: {},
      rankFields: ['someField'],
      returnDocuments: true,
      topN: 2,
    };

    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    rerank.mockResolvedValue({
      model: 'some-model',
      data: [{}],
      usage: { rerankUnits: 1 },
    } as RerankResult);

    await inference.rerank(rerankingModel, myQuery, myDocuments);
    expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
  });

  test("Confirm rankFields default to ['text'] if not provided and if docs contain 'text' key", async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];

    const expectedReq = {
      model: rerankingModel,
      query: myQuery,
      documents: myDocuments,
      parameters: {},
      rankFields: ['text'],
      returnDocuments: true,
      topN: 2,
    };

    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    rerank.mockResolvedValue({
      model: 'some-model',
      data: [{}],
      usage: { rerankUnits: 1 },
    } as RerankResult);

    // Confirm that when I don't pass options.reRankField when calling rerank, but ['text'] is used as the default:
    await inference.rerank(rerankingModel, myQuery, myDocuments);
    expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
  });

  test("Confirm error thrown if no rankFields are passed AND docs do not have 'text' key in them", async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [{ notText: 'doc1' }, { notText: 'doc2' }];

    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    rerank.mockResolvedValue({
      model: 'some-model',
      data: [{}],
      usage: { rerankUnits: 1 },
    } as RerankResult);

    const expectedError = new PineconeArgumentError(
      'One or more documents are missing the specified rank field: customField'
    );
    try {
      await inference.rerank(rerankingModel, myQuery, myDocuments);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  test('(Happy path) Confirm custom rankFields can be passed explicitly', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [{ customField: 'doc1' }, { customField: 'doc2' }];
    const rankFields = ['customField'];

    const expectedReq = {
      model: rerankingModel,
      query: myQuery,
      documents: myDocuments,
      parameters: {},
      rankFields: rankFields,
      returnDocuments: true,
      topN: 2,
    };

    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    rerank.mockResolvedValue({
      model: 'some-model',
      data: [{}],
      usage: { rerankUnits: 1 },
    } as RerankResult);

    await inference.rerank(rerankingModel, myQuery, myDocuments, {
      rankFields: rankFields,
    });
    expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
  });

  test('Confirm list of strings as docs is converted to list of objects with `text` key', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = ['doc1', 'doc2'];
    const expectedDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    rerank.mockResolvedValue({
      model: 'some-model',
      data: [{}],
      usage: { rerankUnits: 1 },
    } as RerankResult);
    await inference.rerank(rerankingModel, myQuery, myDocuments);

    const expectedReq = {
      model: rerankingModel,
      query: myQuery,
      documents: expectedDocuments,
      // defaults:
      parameters: {},
      rankFields: ['text'],
      returnDocuments: true,
      topN: 2,
    };

    expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
  });

  test.skip(
    'Skip until backend error is built to prevent users from passing 2+ fields to BGE, since it only allows' +
      ' one',
    async () => {
      test('Confirm provided rankFields override default `text` field for ranking', async () => {
        const rerankingModel = 'test-model';
        const myQuery = 'test-query';
        const myDocuments = [
          { text: 'doc1', title: 'title1' },
          { text: 'doc2', title: 'title2' },
        ];
        const rankFields = ['text', 'title'];
        const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
        // @ts-ignore
        rerank.mockResolvedValue({ rerankResponse: {} });
        await inference.rerank(rerankingModel, myQuery, myDocuments, {
          rankFields,
        });

        const expectedReq = {
          model: rerankingModel,
          query: myQuery,
          documents: myDocuments,
          rankFields,
          // defaults:
          parameters: {},
          returnDocuments: true,
          topN: 2,
        };

        expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
      });
    }
  );

  test('Confirm error thrown if query is missing', async () => {
    const rerankingModel = 'test-model';
    const myQuery = '';
    const myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
    const expectedError = new PineconeArgumentError(
      'You must pass a query to rerank'
    );
    try {
      await inference.rerank(rerankingModel, myQuery, myDocuments);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  test('Confirm error thrown if model is missing', async () => {
    const rerankingModel = '';
    const myQuery = 'test-query';
    const myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
    const expectedError = new PineconeArgumentError(
      'You must pass the name of a supported reranking model in order to rerank' +
        ' documents. See https://docs.pinecone.io/models for supported models.'
    );
    try {
      await inference.rerank(rerankingModel, myQuery, myDocuments);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });
});
