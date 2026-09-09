import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeArgumentError,
  PineconeNotFoundError,
  PineconeBadRequestError,
} from '../../../errors';
import { indexOperationsBuilder } from '../../indexOperationsBuilder';
import { Collections } from '../collections';
import type { CollectionModel, CollectionList } from '../listCollections';

jest.mock('../../indexOperationsBuilder');
const collection: CollectionModel = {
  name: 'snapshot',
  status: 'Ready',
  environment: 'us-east-1-aws',
  dimension: 128,
  vectorCount: 42,
  size: 2048,
};
const list: CollectionList = { collections: [collection] };

describe('Collections operation contracts through the public facade', () => {
  let api: ManageIndexesApi;
  let collections: Collections;
  beforeEach(() => {
    jest.resetAllMocks();
    api = new ManageIndexesApi();
    jest.spyOn(api, 'createCollection').mockResolvedValue(collection);
    jest.spyOn(api, 'describeCollection').mockResolvedValue(collection);
    jest.spyOn(api, 'deleteCollection').mockResolvedValue(undefined);
    jest.spyOn(api, 'listCollections').mockResolvedValue(list);
    jest.mocked(indexOperationsBuilder).mockReturnValue(api);
    collections = new Collections({
      apiKey: 'test-key',
      additionalHeaders: { 'x-test': 'collections' },
    });
  });
  test('constructs its API with the supplied configuration', () => {
    expect(indexOperationsBuilder).toHaveBeenCalledTimes(1);
    expect(indexOperationsBuilder).toHaveBeenCalledWith({
      apiKey: 'test-key',
      additionalHeaders: { 'x-test': 'collections' },
    });
  });
  test('creates with the source index and collection name', async () => {
    await expect(
      collections.create({ name: 'snapshot', source: 'pod-index' }),
    ).resolves.toStrictEqual(collection);
    expect(api.createCollection).toHaveBeenCalledTimes(1);
    expect(api.createCollection).toHaveBeenCalledWith({
      createCollectionRequest: { name: 'snapshot', source: 'pod-index' },
      xPineconeApiVersion: '2026-07',
    });
  });
  test('lists with only the API version', async () => {
    await expect(collections.list()).resolves.toStrictEqual(list);
    expect(api.listCollections).toHaveBeenCalledTimes(1);
    expect(api.listCollections).toHaveBeenCalledWith({
      xPineconeApiVersion: '2026-07',
    });
  });
  test('describes using collectionName', async () => {
    await expect(collections.describe('snapshot')).resolves.toStrictEqual(
      collection,
    );
    expect(api.describeCollection).toHaveBeenCalledTimes(1);
    expect(api.describeCollection).toHaveBeenCalledWith({
      collectionName: 'snapshot',
      xPineconeApiVersion: '2026-07',
    });
  });
  test('deletes using collectionName', async () => {
    await expect(collections.delete('snapshot')).resolves.toBeUndefined();
    expect(api.deleteCollection).toHaveBeenCalledTimes(1);
    expect(api.deleteCollection).toHaveBeenCalledWith({
      collectionName: 'snapshot',
      xPineconeApiVersion: '2026-07',
    });
  });
  const invalidCalls = [
    [
      'create name',
      'name',
      (c: Collections, value: string) =>
        c.create({ name: value, source: 'pod-index' }),
    ],
    [
      'create source',
      'source',
      (c: Collections, value: string) =>
        c.create({ name: 'snapshot', source: value }),
    ],
    [
      'describe',
      'collectionName',
      (c: Collections, value: string) => c.describe(value),
    ],
    [
      'delete',
      'collectionName',
      (c: Collections, value: string) => c.delete(value),
    ],
  ] as const;
  describe.each(invalidCalls)('%s validation', (_, field, invoke) => {
    test.each(['', undefined, null])(
      'rejects %s before calling the API',
      async (value) => {
        await expect(
          invoke(collections, value as unknown as string),
        ).rejects.toMatchObject({
          name: 'PineconeArgumentError',
          message: expect.stringContaining(`\`${field}\``),
        });
        for (const method of [
          'createCollection',
          'describeCollection',
          'deleteCollection',
        ] as const)
          expect(api[method]).not.toHaveBeenCalled();
      },
    );
  });
  const errorCalls = [
    [
      'createCollection',
      'Error creating collection snapshot: missing',
      (c: Collections) => c.create({ name: 'snapshot', source: 'pod-index' }),
    ],
    [
      'listCollections',
      'Error listing collections: missing',
      (c: Collections) => c.list(),
    ],
    [
      'describeCollection',
      'Error describing collection snapshot: missing',
      (c: Collections) => c.describe('snapshot'),
    ],
    [
      'deleteCollection',
      'Error deleting collection snapshot: missing',
      (c: Collections) => c.delete('snapshot'),
    ],
  ] as const;
  test.each(errorCalls)(
    '%s maps HTTP errors with operation context',
    async (method, message, invoke) => {
      jest.mocked(api[method]).mockRejectedValue(
        new ResponseError(
          new Response(JSON.stringify({ message: 'missing' }), {
            status: 400,
          }),
        ),
      );
      await expect(invoke(collections)).rejects.toEqual(
        new PineconeBadRequestError({ status: 400, message }),
      );
    },
  );
  test.each(errorCalls)(
    '%s preserves SDK errors',
    async (method, _, invoke) => {
      const error = new PineconeArgumentError('already mapped');
      jest.mocked(api[method]).mockRejectedValue(error);
      await expect(invoke(collections)).rejects.toBe(error);
    },
  );
  test.each(errorCalls)(
    '%s maps missing resources to a not-found error',
    async (method, _, invoke) => {
      jest
        .mocked(api[method])
        .mockRejectedValue(
          new ResponseError(new Response('missing', { status: 404 })),
        );
      await expect(invoke(collections)).rejects.toBeInstanceOf(
        PineconeNotFoundError,
      );
    },
  );
});
