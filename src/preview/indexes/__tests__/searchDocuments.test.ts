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
  usage: { readUnits: 5 },
};

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    searchDocuments: jest.fn().mockResolvedValue(mockResponse),
    ...overrides,
  }) as unknown as DocumentOperationsApi;

const validOptions: PreviewSearchDocumentsOptions = {
  scoreBy: [{ type: 'text', field: 'content', query: 'machine learning' }],
  topK: 5,
};

describe('searchPreviewDocuments', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when scoreBy is an empty array', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          scoreBy: [],
        }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `scoreBy` when it is empty', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          scoreBy: [],
        }),
      ).rejects.toThrow('`scoreBy`');
    });

    test('throws PineconeArgumentError when scoreBy is missing', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          topK: 5,
        } as PreviewSearchDocumentsOptions),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('throws PineconeArgumentError when topK is less than 1', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          topK: 0,
        }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `topK` when it is invalid', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          ...validOptions,
          topK: 0,
        }),
      ).rejects.toThrow('`topK`');
    });

    test('throws PineconeArgumentError when topK is missing', async () => {
      await expect(
        searchPreviewDocuments(buildMockApi(), 'test-ns', {
          scoreBy: validOptions.scoreBy,
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
      expect(result.usage.readUnits).toBeGreaterThanOrEqual(0);
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'my-namespace', validOptions);
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes scoreBy and topK to the API call', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          searchDocumentsRequest: expect.objectContaining({
            scoreBy: validOptions.scoreBy,
            topK: 5,
          }),
        }),
      );
    });

    test('passes includeFields when provided', async () => {
      const api = buildMockApi();
      await searchPreviewDocuments(api, 'test-ns', {
        ...validOptions,
        includeFields: ['content', 'title'],
      });
      expect(api.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          searchDocumentsRequest: expect.objectContaining({
            includeFields: ['content', 'title'],
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
