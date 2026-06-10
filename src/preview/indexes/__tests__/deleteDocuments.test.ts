import { deletePreviewDocuments } from '../deleteDocuments';
import type { PreviewDeleteDocumentsOptions } from '../deleteDocuments';
import { PineconeArgumentError } from '../../../errors';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch-alpha/db_data';

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    deleteDocuments: jest.fn().mockResolvedValue({}),
    ...overrides,
  }) as unknown as DocumentOperationsApi;

describe('deletePreviewDocuments', () => {
  describe('validation', () => {
    test('throws when neither ids nor deleteAll is provided', async () => {
      await expect(
        deletePreviewDocuments(buildMockApi(), 'test-ns', {}),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references ids and deleteAll when neither is provided', async () => {
      await expect(
        deletePreviewDocuments(buildMockApi(), 'test-ns', {}),
      ).rejects.toThrow('`ids` or `deleteAll`');
    });

    test('throws when both ids and deleteAll are provided', async () => {
      const options: PreviewDeleteDocumentsOptions = {
        ids: ['doc-1'],
        deleteAll: true,
      };
      await expect(
        deletePreviewDocuments(buildMockApi(), 'test-ns', options),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message mentions mutual exclusion when both ids and deleteAll are set', async () => {
      await expect(
        deletePreviewDocuments(buildMockApi(), 'test-ns', {
          ids: ['doc-1'],
          deleteAll: true,
        }),
      ).rejects.toThrow('mutually exclusive');
    });

    test('throws when ids is an empty array', async () => {
      await expect(
        deletePreviewDocuments(buildMockApi(), 'test-ns', { ids: [] }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references ids when the array is empty', async () => {
      await expect(
        deletePreviewDocuments(buildMockApi(), 'test-ns', { ids: [] }),
      ).rejects.toThrow('`ids`');
    });
  });

  describe('success', () => {
    test('resolves to void when ids are provided', async () => {
      const result = await deletePreviewDocuments(buildMockApi(), 'test-ns', {
        ids: ['doc-1', 'doc-2'],
      });
      expect(result).toBeUndefined();
    });

    test('passes ids in deleteDocumentsRequest', async () => {
      const api = buildMockApi();
      await deletePreviewDocuments(api, 'test-ns', { ids: ['doc-1', 'doc-2'] });
      expect(api.deleteDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteDocumentsRequest: expect.objectContaining({
            ids: ['doc-1', 'doc-2'],
          }),
        }),
      );
    });

    test('resolves to void when deleteAll is true', async () => {
      const result = await deletePreviewDocuments(buildMockApi(), 'test-ns', {
        deleteAll: true,
      });
      expect(result).toBeUndefined();
    });

    test('passes deleteAll in deleteDocumentsRequest', async () => {
      const api = buildMockApi();
      await deletePreviewDocuments(api, 'test-ns', { deleteAll: true });
      expect(api.deleteDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteDocumentsRequest: expect.objectContaining({
            deleteAll: true,
          }),
        }),
      );
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await deletePreviewDocuments(api, 'my-namespace', {
        ids: ['doc-1'],
      });
      expect(api.deleteDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes xPineconeApiVersion containing 2026 in every call', async () => {
      const api = buildMockApi();
      await deletePreviewDocuments(api, 'test-ns', { ids: ['doc-1'] });
      expect(api.deleteDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('converts ResponseError to a typed Pinecone error via handleApiError', async () => {
      const { ResponseError } =
        await import('../../../pinecone-generated-ts-fetch-alpha/db_data');
      const api = buildMockApi({
        deleteDocuments: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"code": 5, "message": "Index not found"}', {
              status: 404,
            }),
            'Not Found',
          ),
        ),
      });
      await expect(
        deletePreviewDocuments(api, 'test-ns', { ids: ['doc-1'] }),
      ).rejects.toBeDefined();
    });
  });
});
