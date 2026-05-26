import { searchPreviewDocuments } from '../searchDocuments';
import { PineconeArgumentError } from '../../../errors';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch-alpha/db_data';
import type { PreviewSearchDocumentsOptions } from '../searchDocuments';

const mockResponse = {
  matches: [
    { _id: 'doc-1', _score: 0.95, content: 'Machine learning' },
    { _id: 'doc-2', _score: 0.82, content: 'Vector databases' },
  ],
  namespace: 'test-ns',
  usage: { read_units: 5 },
};

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    searchDocuments: jest.fn().mockResolvedValue(mockResponse),
    ...overrides,
  }) as unknown as DocumentOperationsApi;

const validOptions: PreviewSearchDocumentsOptions = {
  score_by: [{ type: 'text', field: 'content', query: 'machine learning' }],
  top_k: 5,
};

describe('searchPreviewDocuments', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when score_by is an empty array', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          score_by: [],
        }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `score_by` when it is empty', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          score_by: [],
        }),
      ).rejects.toThrow('`score_by`');
    });

    test('throws PineconeArgumentError when score_by is missing', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          top_k: 5,
        } as PreviewSearchDocumentsOptions),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('throws PineconeArgumentError when top_k is less than 1', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          top_k: 0,
        }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `top_k` when it is invalid', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          top_k: 0,
        }),
      ).rejects.toThrow('`top_k`');
    });

    test('throws PineconeArgumentError when top_k is missing', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          score_by: validOptions.score_by,
        } as PreviewSearchDocumentsOptions),
      ).rejects.toThrow(PineconeArgumentError);
    });
  });

  describe('success', () => {
    test('returns PreviewSearchDocumentsResponse with matches, namespace, usage', async () => {
      const result = await searchPreviewDocuments(
        buildMockApi(),
        'test-ns',
        validOptions,
      );
      expect(result.matches).toBeDefined();
      expect(result.namespace).toBe('test-ns');
      expect(result.usage).toBeDefined();
      expect(result.usage.read_units).toBeGreaterThanOrEqual(0);
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'my-namespace', validOptions);
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes score_by and top_k to the API call', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          searchDocumentsRequest: expect.objectContaining({
            score_by: validOptions.score_by,
            top_k: 5,
          }),
        }),
      );
    });

    test('passes include_fields when provided', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'test-ns', {
        ...validOptions,
        include_fields: ['content', 'title'],
      });
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          searchDocumentsRequest: expect.objectContaining({
            include_fields: ['content', 'title'],
          }),
        }),
      );
    });

    test('passes filter when provided', async () => {
      const api = buildMockApi();
      const filter = { category: 'news' };
      await searchPreviewDocuments(api, 'test-ns', {
        ...validOptions,
        filter,
      });
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          searchDocumentsRequest: expect.objectContaining({ filter }),
        }),
      );
    });

    test('passes xPineconeApiVersion containing 2026 in every call', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.searchDocuments).toHaveBeenCalledWith(
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
        searchDocuments: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"code": 5, "message": "Index not found"}', {
              status: 404,
            }),
            'Not Found',
          ),
        ),
      });
      await expect(
        searchPreviewDocuments(api, 'test-ns', validOptions),
      ).rejects.toBeDefined();
    });
  });
});
