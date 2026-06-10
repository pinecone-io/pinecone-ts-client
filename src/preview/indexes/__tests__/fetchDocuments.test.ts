import { fetchPreviewDocuments } from '../fetchDocuments';
import { PineconeArgumentError } from '../../../errors';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch-alpha/db_data';
import type { PreviewFetchDocumentsOptions } from '../fetchDocuments';

const mockResponse = {
  documents: {
    'doc-1': { _id: 'doc-1', title: 'ML Doc', content: 'Machine learning' },
    'doc-2': { _id: 'doc-2', title: 'VDB Doc', content: 'Vector databases' },
  },
  namespace: 'test-ns',
  usage: { readUnits: 2 },
};

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    fetchDocuments: jest.fn().mockResolvedValue(mockResponse),
    ...overrides,
  }) as unknown as DocumentOperationsApi;

const validOptions: PreviewFetchDocumentsOptions = {
  ids: ['doc-1', 'doc-2'],
};

describe('fetchPreviewDocuments', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when ids is an empty array', async () => {
      await expect(
        fetchPreviewDocuments(buildMockApi(), 'test-ns', { ids: [] }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `ids` when the array is empty', async () => {
      await expect(
        fetchPreviewDocuments(buildMockApi(), 'test-ns', { ids: [] }),
      ).rejects.toThrow('`ids`');
    });

    test('throws PineconeArgumentError when ids is missing', async () => {
      await expect(
        fetchPreviewDocuments(
          buildMockApi(),
          'test-ns',
          {} as PreviewFetchDocumentsOptions,
        ),
      ).rejects.toThrow(PineconeArgumentError);
    });
  });

  describe('success', () => {
    test('returns PreviewFetchDocumentsResponse with documents, namespace, usage', async () => {
      const result = await fetchPreviewDocuments(
        buildMockApi(),
        'test-ns',
        validOptions,
      );
      expect(result.documents).toBeDefined();
      expect(result.namespace).toBe('test-ns');
      expect(result.usage.readUnits).toBeGreaterThanOrEqual(0);
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await fetchPreviewDocuments(api, 'my-namespace', validOptions);
      expect(api.fetchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes ids to the API call', async () => {
      const api = buildMockApi();
      await fetchPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.fetchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchDocumentsRequest: expect.objectContaining({
            ids: ['doc-1', 'doc-2'],
          }),
        }),
      );
    });

    test('passes includeFields when provided', async () => {
      const api = buildMockApi();
      await fetchPreviewDocuments(api, 'test-ns', {
        ...validOptions,
        includeFields: ['title'],
      });
      expect(api.fetchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchDocumentsRequest: expect.objectContaining({
            includeFields: ['title'],
          }),
        }),
      );
    });

    test('passes xPineconeApiVersion containing 2026 in every call', async () => {
      const api = buildMockApi();
      await fetchPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.fetchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('converts ResponseError (404) to a typed Pinecone error via handleApiError', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_data');
      const api = buildMockApi({
        fetchDocuments: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"code": 5, "message": "Index not found"}', {
              status: 404,
            }),
            'Not Found',
          ),
        ),
      });
      await expect(
        fetchPreviewDocuments(api, 'test-ns', validOptions),
      ).rejects.toBeDefined();
    });
  });
});
