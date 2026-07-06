import { listPreviewDocuments } from '../listDocuments';
import { PineconeArgumentError } from '../../../errors';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch-alpha/db_data';
import type { PreviewListDocumentsOptions } from '../listDocuments';

const mockResponse = {
  documents: [{ _id: 'doc-1' }, { _id: 'doc-2' }],
  pagination: { next: 'next-token' },
  namespace: 'test-ns',
  usage: { readUnits: 1 },
};

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    listDocuments: jest.fn().mockResolvedValue(mockResponse),
    ...overrides,
  }) as DocumentOperationsApi;

describe('listPreviewDocuments', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when limit is less than 1', async () => {
      await expect(
        listPreviewDocuments(buildMockApi(), 'test-ns', { limit: 0 }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `limit` when it is invalid', async () => {
      await expect(
        listPreviewDocuments(buildMockApi(), 'test-ns', { limit: -5 }),
      ).rejects.toThrow('`limit`');
    });

    test('does not throw when no options are provided', async () => {
      await expect(
        listPreviewDocuments(buildMockApi(), 'test-ns'),
      ).resolves.toBeDefined();
    });
  });

  describe('success', () => {
    test('returns PreviewListDocumentsResponse with documents, namespace, usage', async () => {
      const result = await listPreviewDocuments(buildMockApi(), 'test-ns');
      expect(result.documents).toBeDefined();
      expect(result.namespace).toBe('test-ns');
      expect(result.usage.readUnits).toBeGreaterThanOrEqual(0);
    });

    test('passes the pagination token through on the response', async () => {
      const result = await listPreviewDocuments(buildMockApi(), 'test-ns');
      expect(result.pagination?.next).toBe('next-token');
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await listPreviewDocuments(api, 'my-namespace');
      expect(api.listDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes prefix, limit, and paginationToken to the API call', async () => {
      const api = buildMockApi();
      const options: PreviewListDocumentsOptions = {
        prefix: 'doc-',
        limit: 50,
        paginationToken: 'token-abc',
      };
      await listPreviewDocuments(api, 'test-ns', options);
      expect(api.listDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          listDocumentsRequest: expect.objectContaining({
            prefix: 'doc-',
            limit: 50,
            paginationToken: 'token-abc',
          }),
        }),
      );
    });

    test('passes xPineconeApiVersion containing 2026 in every call', async () => {
      const api = buildMockApi();
      await listPreviewDocuments(api, 'test-ns');
      expect(api.listDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('converts ResponseError (404) to a typed Pinecone error via handleApiError', async () => {
      const { ResponseError } = await import(
        '../../../pinecone-generated-ts-fetch-alpha/db_data'
      );
      const api = buildMockApi({
        listDocuments: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"code": 5, "message": "Index not found"}', {
              status: 404,
            }),
            'Not Found',
          ),
        ),
      });
      await expect(
        listPreviewDocuments(api, 'test-ns'),
      ).rejects.toBeDefined();
    });
  });
});
