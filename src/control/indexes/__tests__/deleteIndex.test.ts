import { deleteIndex } from '../deleteIndex';
import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeConnectionError,
  PineconeNotFoundError,
} from '../../../errors';

describe('deleteIndex', () => {
  const request = jest.fn();
  const api = { deleteIndex: request } as unknown as ManageIndexesApi;
  beforeEach(() => request.mockReset());
  test('forwards the exact request and preserves the response', async () => {
    const response = undefined;
    request.mockResolvedValue(response);
    await expect(deleteIndex(api, 'index')).resolves.toBe(response);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      indexName: 'index',
      xPineconeApiVersion: '2026-07',
    });
  });
  test('maps response errors with operation context', async () => {
    request.mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ message: 'missing' }), { status: 404 }),
      ),
    );
    await expect(deleteIndex(api, 'index')).rejects.toThrow(
      new PineconeNotFoundError({
        status: 404,
        message: 'Error deleting index index: missing',
      }),
    );
  });
  test('wraps network failures', async () => {
    request.mockRejectedValue(new Error('offline'));
    await expect(deleteIndex(api, 'index')).rejects.toThrow(
      PineconeConnectionError,
    );
  });
  test('rejects an empty name before making a request', async () => {
    await expect(deleteIndex(api, '')).rejects.toThrow('non-empty string');
    expect(request).not.toHaveBeenCalled();
  });
});
