import { listIndexes } from '../listIndexes';
import {
  PineconeInternalServerError,
  PineconeAuthorizationError,
} from '../../errors';

describe('listIndexes', () => {
  test('should return a list of index objects', async () => {
    const IndexOperationsApi = {
      listIndexes: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(['index-name', 'index-name-2'])
        ),
    };

    // @ts-ignore
    const returned = await listIndexes(IndexOperationsApi)();

    expect(returned).toEqual([
      { name: 'index-name' },
      { name: 'index-name-2' },
    ]);
  });

  test('it should map errors with the http error mapper (500)', async () => {
    const IndexOperationsApi = {
      listIndexes: jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({ response: { status: 500, text: async () => '' } })
        ),
    };

    // @ts-ignore
    const expectToThrow = async () => await listIndexes(IndexOperationsApi)();

    expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
  });

  test('it should map errors with the http error mapper (401)', async () => {
    const IndexOperationsApi = {
      listIndexes: jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({ response: { status: 401, text: async () => '' } })
        ),
    };

    // @ts-ignore
    const expectToThrow = async () => await listIndexes(IndexOperationsApi)();

    expect(expectToThrow).rejects.toThrowError(PineconeAuthorizationError);
  });
});
