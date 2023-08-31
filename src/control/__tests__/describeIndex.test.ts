import { describeIndex } from '../describeIndex';
import {
  PineconeArgumentError,
  PineconeInternalServerError,
  PineconeNotFoundError,
} from '../../errors';

describe('describeIndex', () => {
  let responseData;

  const setupSuccessResponse = () => {
    return {
      describeIndex: jest
        .fn()
        .mockImplementation(() => Promise.resolve(responseData)),
    };
  };

  const setupErrorResponse = (response) => {
    return {
      describeIndex: jest
        .fn()
        .mockImplementation(() => Promise.reject({ response })),
      listIndexes: jest
        .fn()
        .mockImplementation(() => Promise.resolve(['foo', 'bar'])),
    };
  };

  beforeEach(() => {
    responseData = Object.freeze({
      database: {
        name: 'test-index',
        dimensions: undefined,
        indexType: undefined,
        metric: 'cosine',
        pods: 1,
        replicas: 1,
        shards: 1,
        podType: 'p1.x1',
        indexConfig: undefined,
        metadataConfig: undefined,
      },
      status: { ready: true, state: 'Ready' },
    });
  });

  test('should remove undefined fields from response', async () => {
    const IOA = setupSuccessResponse();

    // @ts-ignore
    const returned = await describeIndex(IOA)('index-name');

    expect(returned).toEqual({
      database: {
        name: 'test-index',
        metric: 'cosine',
        pods: 1,
        replicas: 1,
        shards: 1,
        podType: 'p1.x1',
      },
      status: { ready: true, state: 'Ready' },
    });
  });

  describe('argument validation', () => {
    test('should throw if index name is not provided', async () => {
      const IOA = setupSuccessResponse();

      // @ts-ignore
      const expectToThrow = async () => await describeIndex(IOA)();

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to describeIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const IOA = setupSuccessResponse();

      // @ts-ignore
      const expectToThrow = async () => await describeIndex(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to describeIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const IOA = setupSuccessResponse();

      // @ts-ignore
      const expectToThrow = async () => await describeIndex(IOA)('');

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to describeIndex had validation errors: argument must not be blank.'
      );
    });
  });

  describe('uses http error mapper', () => {
    test('it should map errors with the http error mapper (500)', async () => {
      const IOA = setupErrorResponse({ status: 500, text: async () => '' });

      // @ts-ignore
      const expectToThrow = async () => await describeIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
    });
  });

  describe('custom error mapping', () => {
    test('not found (404), fetches and shows available index names', async () => {
      const IOA = setupErrorResponse({ status: 404, text: async () => '' });

      // @ts-ignore
      const expectToThrow = async () => await describeIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist. Valid index names: ['foo', 'bar']`
      );
    });

    test('not found (404), error while fetching index list', async () => {
      const IOA = {
        describeIndex: jest
          .fn()
          .mockImplementation(() =>
            Promise.reject({ response: { status: 404, text: async () => '' } })
          ),
        listIndexes: jest
          .fn()
          .mockImplementation(() => Promise.reject('error')),
      };

      // @ts-ignore
      const expectToThrow = async () => await describeIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist.`
      );
    });
  });
});
