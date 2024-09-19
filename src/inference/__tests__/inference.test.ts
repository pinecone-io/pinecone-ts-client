import { Inference } from '../inference';
import type { PineconeConfiguration } from '../../data';
import { inferenceOperationsBuilder } from '../inferenceOperationsBuilder';
import { PineconeArgumentError } from '../../errors';

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

  test('Throws error if list of dicts is passed for docs, but does not contain `text` key', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [{ id: '1' }, { id: '2' }];
    const expectedError = new PineconeArgumentError(
      '`documents` can only be a list of strings or a list of dictionaries with at least a `text` key, followed by a string value'
    );
    try {
      await inference.rerank(rerankingModel, myQuery, myDocuments);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  test('Confirm list of strings as docs is converted to list of dicts with `text` key', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = ['doc1', 'doc2'];
    const expectedDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    // @ts-ignore
    rerank.mockResolvedValue({ rerankResponse: {} });
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

  test('Confirm error thrown if rankFields does match fields in passed documents', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [
      { text: 'doc1', title: 'title1' },
      { text: 'doc2', title: 'title2' },
    ];
    const rankFields = ['OopsIMisspelledTheTextField', 'title'];
    const rerank = jest.spyOn(inference._inferenceApi, 'rerank');
    // @ts-ignore
    rerank.mockResolvedValue({ rerankResponse: {} });
    try {
      await inference.rerank(rerankingModel, myQuery, myDocuments, {
        rankFields,
      });
    } catch (error) {
      expect(error).toEqual(
        new PineconeArgumentError(
          'The `rankField` value you passed ("OopsIMisspelledTheTextField") is missing in the document at index 0'
        )
      );
    }
  });

  test('Confirm provided rankFields override default `text` field for ranking', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [
      { text: 'doc1', title: 'title1' },
      { text: 'doc2', title: 'title2' },
    ];
    const rankFields = ['title'];
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
