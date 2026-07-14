import { upsertPreviewDocuments } from '../upsertDocuments';
import { PineconeArgumentError } from '../../../errors';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch-alpha/db_data';
import type { PreviewUpsertDocumentsOptions } from '../upsertDocuments';

const buildMockApi = (
  overrides: Partial<DocumentOperationsApi> = {},
): DocumentOperationsApi =>
  ({
    upsertDocuments: jest.fn().mockResolvedValue({ upserted_count: 2 }),
    ...overrides,
  }) as DocumentOperationsApi;

const validOptions: PreviewUpsertDocumentsOptions = {
  documents: [
    { _id: 'doc-1', content: 'Hello world', title: 'Test Doc 1' },
    { _id: 'doc-2', content: 'Foo bar', title: 'Test Doc 2' },
  ],
};

describe('upsertPreviewDocuments', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when documents is an empty array', async () => {
      await expect(
        upsertPreviewDocuments(buildMockApi(), 'test-ns', { documents: [] }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `documents` field', async () => {
      await expect(
        upsertPreviewDocuments(buildMockApi(), 'test-ns', { documents: [] }),
      ).rejects.toThrow('`documents`');
    });

    test('throws PineconeArgumentError when options.documents is missing', async () => {
      await expect(
        upsertPreviewDocuments(
          buildMockApi(),
          'test-ns',
          {} as PreviewUpsertDocumentsOptions,
        ),
      ).rejects.toThrow(PineconeArgumentError);
    });
  });

  describe('success', () => {
    test('returns upserted_count from the API response', async () => {
      const result = await upsertPreviewDocuments(
        buildMockApi(),
        'test-ns',
        validOptions,
      );
      expect(result).toEqual({ upserted_count: 2 });
    });

    test('passes namespace to the API call', async () => {
      const api = buildMockApi();
      await upsertPreviewDocuments(api, 'my-namespace', validOptions);
      expect(api.upsertDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: 'my-namespace' }),
      );
    });

    test('passes documents to the API call', async () => {
      const api = buildMockApi();
      await upsertPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.upsertDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          upsertDocumentsRequest: expect.objectContaining({
            documents: validOptions.documents,
          }),
        }),
      );
    });

    test('passes xPineconeApiVersion containing 2026 in every call', async () => {
      const api = buildMockApi();
      await upsertPreviewDocuments(api, 'test-ns', validOptions);
      expect(api.upsertDocuments).toHaveBeenCalledWith(
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
        upsertDocuments: jest.fn().mockRejectedValue(
          new ResponseError(
            new Response('{"code": 5, "message": "Index not found"}', {
              status: 404,
            }),
            'Not Found',
          ),
        ),
      });
      await expect(
        upsertPreviewDocuments(api, 'test-ns', validOptions),
      ).rejects.toBeDefined();
    });
  });
});
