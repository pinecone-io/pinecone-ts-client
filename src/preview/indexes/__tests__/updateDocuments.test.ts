import { updatePreviewDocuments } from '../updateDocuments';
import { PineconeArgumentError } from '../../../errors';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch-alpha/db_data';
import type { PreviewUpdateDocumentsOptions } from '../updateDocuments';

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    updateDocuments: jest.fn().mockResolvedValue({}),
    ...overrides,
  }) as DocumentOperationsApi;

const validOptions: PreviewUpdateDocumentsOptions = {
  documents: [
    { _id: 'doc-1', chunk_text: 'Updated content' },
    { _id: 'doc-2', _remove_fields: ['category'] },
  ],
};

describe('updatePreviewDocuments', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when documents is an empty array', async () => {
      await expect(
        updatePreviewDocuments(buildMockApi(), 'test-ns', { documents: [] }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references `documents` when the array is empty', async () => {
      await expect(
        updatePreviewDocuments(buildMockApi(), 'test-ns', { documents: [] }),
      ).rejects.toThrow('`documents`');
    });

    test('throws PineconeArgumentError when documents is missing', async () => {
      await expect(
        updatePreviewDocuments(
          buildMockApi(),
          'test-ns',
          {} as PreviewUpdateDocumentsOptions,
        ),
      ).rejects.toThrow(PineconeArgumentError);
    });
  });

  describe('success', () => {
    test('resolves to void', async () => {
      const result = await updatePreviewDocuments(
        buildMockApi(),
        'test-ns',
        validOptions,
      );
      expect(result).toBeUndefined();
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await updatePreviewDocuments(api, 'my-namespace', validOptions);
      expect(api.updateDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes documents (including _remove_fields) to the API call', async () => {
      const api = buildMockApi();
      await updatePreviewDocuments(api, 'test-ns', validOptions);
      expect(api.updateDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          updateDocumentsRequest: expect.objectContaining({
            documents: validOptions.documents,
          }),
        }),
      );
    });

    test('passes xPineconeApiVersion containing 2026 in every call', async () => {
      const api = buildMockApi();
      await updatePreviewDocuments(api, 'test-ns', validOptions);
      expect(api.updateDocuments).toHaveBeenCalledWith(
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
        updateDocuments: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"code": 5, "message": "Index not found"}', {
              status: 404,
            }),
            'Not Found',
          ),
        ),
      });
      await expect(
        updatePreviewDocuments(api, 'test-ns', validOptions),
      ).rejects.toBeDefined();
    });
  });
});
