import { listCollections } from '../listCollections';
import {
  PineconeInternalServerError,
  PineconeAuthorizationError,
} from '../../errors';

describe('listCollections', () => {
  test('should return a list of collections', async () => {
    const IOA = {
      listCollections: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(['collection-name', 'collection-name-2'])
        ),
    };

    // @ts-ignore
    const returned = await listCollections(IOA)();

    expect(returned).toEqual(['collection-name', 'collection-name-2']);
  });

  test('it should map errors with the http error mapper (500)', async () => {
    const IOA = {
      listCollections: jest.fn().mockImplementation(() =>
        Promise.reject({
          response: {
            status: 500,
            text: async () => 'Internal Server Error',
          },
        })
      ),
    };

    // @ts-ignore
    const expectToThrow = async () => await listCollections(IOA)();

    expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
  });

  test('it should map errors with the http error mapper (401)', async () => {
    const IOA = {
      listCollections: jest.fn().mockImplementation(() =>
        Promise.reject({
          response: {
            status: 401,
            text: async () => 'Unauthorized',
          },
        })
      ),
    };

    // @ts-ignore
    const expectToThrow = async () => await listCollections(IOA)();

    expect(expectToThrow).rejects.toThrowError(PineconeAuthorizationError);
  });
});
