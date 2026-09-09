import type { IndexModel } from '../listIndexes';
import { describeIndex } from '../describeIndex';
import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeConnectionError,
  PineconeNotFoundError,
} from '../../../errors';

describe('describeIndex', () => {
  const request = jest.fn();
  const api = { describeIndex: request } as unknown as ManageIndexesApi;
  beforeEach(() => request.mockReset());
  test('forwards the exact request and preserves the response', async () => {
    const response: IndexModel = {
      name: 'index',
      host: 'index.example',
      privateHost: 'private.example',
      status: { ready: true, state: 'Ready' },
      deployment: {
        deploymentType: 'managed',
        cloud: 'aws',
        region: 'us-east-1',
      },
      schema: { fields: {} },
      deletionProtection: 'disabled',
    };
    request.mockResolvedValue(response);
    await expect(describeIndex(api, 'index')).resolves.toBe(response);
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
    await expect(describeIndex(api, 'index')).rejects.toThrow(
      new PineconeNotFoundError({
        status: 404,
        message: 'Error describing index index: missing',
      }),
    );
  });
  test('wraps network failures', async () => {
    request.mockRejectedValue(new Error('offline'));
    await expect(describeIndex(api, 'index')).rejects.toThrow(
      PineconeConnectionError,
    );
  });
  test('rejects an empty name before making a request', async () => {
    await expect(describeIndex(api, '')).rejects.toThrow('non-empty string');
    expect(request).not.toHaveBeenCalled();
  });
});
