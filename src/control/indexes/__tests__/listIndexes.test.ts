import { listIndexes } from '../listIndexes';
import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeConnectionError,
  PineconeNotFoundError,
} from '../../../errors';

describe('listIndexes', () => {
  const request = jest.fn();
  const api = { listIndexes: request } as unknown as ManageIndexesApi;
  beforeEach(() => request.mockReset());
  test('forwards the exact request and preserves the response', async () => {
    const response = { indexes: [] };
    request.mockResolvedValue(response);
    await expect(listIndexes(api)).resolves.toBe(response);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ xPineconeApiVersion: '2026-07' });
  });
  test('maps response errors with operation context', async () => {
    request.mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ message: 'missing' }), { status: 404 }),
      ),
    );
    await expect(listIndexes(api)).rejects.toThrow(
      new PineconeNotFoundError({
        status: 404,
        message: 'Error listing indexes: missing',
      }),
    );
  });
  test('wraps network failures', async () => {
    request.mockRejectedValue(new Error('offline'));
    await expect(listIndexes(api)).rejects.toThrow(PineconeConnectionError);
  });
});
