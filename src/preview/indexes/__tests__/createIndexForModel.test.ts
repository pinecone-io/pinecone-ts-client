import { createIndexForModel } from '../createIndexForModel';
import { PineconeArgumentError } from '../../../errors';
import type { ManageIndexesApi } from '../../../pinecone-generated-ts-fetch-alpha/db_control';
import type { PreviewCreateIndexForModelOptions } from '../createIndexForModel';

const validOptions: PreviewCreateIndexForModelOptions = {
  name: 'model-idx',
  cloud: 'aws',
  region: 'us-east-1',
  field: 'text',
  model: 'multilingual-e5-large',
};

const buildMockApi = (
  overrides: Partial<ManageIndexesApi> = {},
): ManageIndexesApi =>
  ({
    createIndexForModel: jest.fn().mockResolvedValue({
      name: 'model-idx',
      status: { ready: true },
    }),
    ...overrides,
  }) as unknown as ManageIndexesApi;

describe('createIndexForModel', () => {
  describe('validation', () => {
    test('throws PineconeArgumentError when cloud is empty', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, cloud: '' }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `cloud` field', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, cloud: '' }),
      ).rejects.toThrow('`cloud`');
    });

    test('throws PineconeArgumentError when region is empty', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, region: '' }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `region` field', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, region: '' }),
      ).rejects.toThrow('`region`');
    });

    test('throws PineconeArgumentError when field is empty', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, field: '' }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `field` field', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, field: '' }),
      ).rejects.toThrow('`field`');
    });

    test('throws PineconeArgumentError when model is empty', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, model: '' }),
      ).rejects.toThrow(PineconeArgumentError);
    });

    test('error message references the `model` field', async () => {
      await expect(
        createIndexForModel(buildMockApi(), { ...validOptions, model: '' }),
      ).rejects.toThrow('`model`');
    });
  });

  describe('success', () => {
    test('returns IndexModel on success', async () => {
      const result = await createIndexForModel(buildMockApi(), validOptions);
      expect(result).toMatchObject({ name: 'model-idx' });
    });

    test('passes field, model, and managed deployment to the API client', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, validOptions);
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexForModelRequest: expect.objectContaining({
            field: 'text',
            model: 'multilingual-e5-large',
            deployment: expect.objectContaining({
              deployment_type: 'managed',
              cloud: 'aws',
              region: 'us-east-1',
            }),
          }),
        }),
      );
    });

    test('uses the alpha API version header', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, validOptions);
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          xPineconeApiVersion: expect.stringContaining('2026'),
        }),
      );
    });

    test('passes optional name when provided', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, validOptions);
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexForModelRequest: expect.objectContaining({
            name: 'model-idx',
          }),
        }),
      );
    });

    test('passes optional tags when provided', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, {
        ...validOptions,
        tags: { env: 'test' },
      });
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexForModelRequest: expect.objectContaining({
            tags: { env: 'test' },
          }),
        }),
      );
    });

    test('passes metric when provided', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, {
        ...validOptions,
        metric: 'cosine',
      });
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexForModelRequest: expect.objectContaining({
            metric: 'cosine',
          }),
        }),
      );
    });

    test('passes writeParameters and readParameters when provided', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, {
        ...validOptions,
        writeParameters: { batch_size: 32 },
        readParameters: { top_k: 10 },
      });
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexForModelRequest: expect.objectContaining({
            write_parameters: { batch_size: 32 },
            read_parameters: { top_k: 10 },
          }),
        }),
      );
    });

    test('passes deletionProtection when provided', async () => {
      const api = buildMockApi();
      await createIndexForModel(api, {
        ...validOptions,
        deletionProtection: 'enabled',
      });
      expect(api.createIndexForModel).toHaveBeenCalledWith(
        expect.objectContaining({
          createIndexForModelRequest: expect.objectContaining({
            deletion_protection: 'enabled',
          }),
        }),
      );
    });
  });

  describe('error handling', () => {
    test('wraps API errors via handleApiError', async () => {
      const api = buildMockApi({
        createIndexForModel: jest
          .fn()
          .mockRejectedValue(
            Object.assign(new Error('Conflict'), { status: 409 }),
          ),
      });
      await expect(createIndexForModel(api, validOptions)).rejects.toThrow();
    });
  });
});
