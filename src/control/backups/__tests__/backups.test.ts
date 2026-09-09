import {
  ManageIndexesApi,
  ResponseError,
} from '../../../pinecone-generated-ts-fetch/db_control';
import type { CreateIndexFromBackupResponse } from '../../../pinecone-generated-ts-fetch/db_control';
import {
  PineconeArgumentError,
  PineconeNotFoundError,
  PineconeBadRequestError,
} from '../../../errors';
import { indexOperationsBuilder } from '../../indexOperationsBuilder';
import { Backups } from '../backups';
import type { BackupModel } from '../describeBackup';
import type { BackupList } from '../listIndexBackups';
import type { CreateIndexFromBackupOptions } from '../createIndexFromBackup';

jest.mock('../../indexOperationsBuilder');

const backup: BackupModel = {
  backupId: 'backup-123',
  sourceIndexName: 'source-index',
  sourceIndexId: 'index-123',
  status: 'Ready',
  cloud: 'aws',
  region: 'us-east-1',
  name: 'weekly',
  sourceIndexDeletedAt: new Date('2026-07-01T00:00:00Z'),
};
const page: BackupList = { data: [backup], pagination: { next: 'next-page' } };
const restore: CreateIndexFromBackupResponse = {
  restoreJobId: 'job-123',
  indexId: 'restored-id',
};

describe('Backups operation contracts through the public facade', () => {
  let api: ManageIndexesApi;
  let backups: Backups;
  beforeEach(() => {
    jest.resetAllMocks();
    api = new ManageIndexesApi();
    jest.spyOn(api, 'createBackup').mockResolvedValue(backup);
    jest.spyOn(api, 'describeBackup').mockResolvedValue(backup);
    jest.spyOn(api, 'deleteBackup').mockResolvedValue(undefined);
    jest.spyOn(api, 'listIndexBackups').mockResolvedValue(page);
    jest.spyOn(api, 'listProjectBackups').mockResolvedValue(page);
    jest
      .spyOn(api, 'createIndexFromBackupOperation')
      .mockResolvedValue(restore);
    jest.mocked(indexOperationsBuilder).mockReturnValue(api);
    backups = new Backups({
      apiKey: 'test-key',
      controllerHostUrl: 'https://controller.example.com',
    });
  });

  test('constructs its API with the supplied configuration', () => {
    expect(indexOperationsBuilder).toHaveBeenCalledTimes(1);
    expect(indexOperationsBuilder).toHaveBeenCalledWith({
      apiKey: 'test-key',
      controllerHostUrl: 'https://controller.example.com',
    });
  });

  test.each([
    undefined,
    {},
    { name: 'weekly', description: 'before migration' },
  ])('creates with options %j', async (options) => {
    await expect(
      backups.create('source-index', options),
    ).resolves.toStrictEqual(backup);
    expect(api.createBackup).toHaveBeenCalledTimes(1);
    expect(api.createBackup).toHaveBeenCalledWith({
      indexName: 'source-index',
      createBackupRequest: options ?? {},
      xPineconeApiVersion: '2026-07',
    });
  });

  test('describes using backupId', async () => {
    await expect(backups.describe('backup-123')).resolves.toStrictEqual(backup);
    expect(api.describeBackup).toHaveBeenCalledTimes(1);
    expect(api.describeBackup).toHaveBeenCalledWith({
      backupId: 'backup-123',
      xPineconeApiVersion: '2026-07',
    });
  });

  test('deletes using backupId', async () => {
    await expect(backups.delete('backup-123')).resolves.toBeUndefined();
    expect(api.deleteBackup).toHaveBeenCalledTimes(1);
    expect(api.deleteBackup).toHaveBeenCalledWith({
      backupId: 'backup-123',
      xPineconeApiVersion: '2026-07',
    });
  });

  test.each([true, false, undefined])(
    'forwards includeDeleted=%s only to the index list',
    async (includeDeleted) => {
      const options = {
        limit: 7,
        paginationToken: 'previous-page',
        includeDeleted,
      };
      await expect(
        backups.listByIndex('source-index', options),
      ).resolves.toStrictEqual(page);
      expect(api.listIndexBackups).toHaveBeenCalledTimes(1);
      expect(api.listIndexBackups).toHaveBeenCalledWith({
        indexName: 'source-index',
        ...options,
        xPineconeApiVersion: '2026-07',
      });
      expect(api.listProjectBackups).not.toHaveBeenCalled();
      // Structural typing permits an options variable with extra fields. The project operation must select only supported fields.
      await expect(backups.list(options)).resolves.toStrictEqual(page);
      expect(
        jest.mocked(api.listProjectBackups).mock.calls[0][0],
      ).not.toHaveProperty('includeDeleted');
      expect(api.listProjectBackups).toHaveBeenCalledTimes(1);
      expect(api.listProjectBackups).toHaveBeenCalledWith({
        limit: 7,
        paginationToken: 'previous-page',
        xPineconeApiVersion: '2026-07',
      });
    },
  );

  test('leaves pagination and includeDeleted defaults to the API', async () => {
    await backups.listByIndex('source-index');
    await backups.list();
    expect(api.listIndexBackups).toHaveBeenCalledTimes(1);
    expect(api.listIndexBackups).toHaveBeenCalledWith({
      indexName: 'source-index',
      limit: undefined,
      paginationToken: undefined,
      includeDeleted: undefined,
      xPineconeApiVersion: '2026-07',
    });
    expect(api.listProjectBackups).toHaveBeenCalledTimes(1);
    expect(api.listProjectBackups).toHaveBeenCalledWith({
      limit: undefined,
      paginationToken: undefined,
      xPineconeApiVersion: '2026-07',
    });
  });

  test.each<CreateIndexFromBackupOptions>([
    { name: 'restored-index' },
    {
      name: 'restored-index',
      tags: { team: 'search' },
      deletionProtection: 'enabled',
      readCapacity: { mode: 'OnDemand' },
    },
    {
      name: 'restored-index',
      deletionProtection: 'disabled',
      readCapacity: {
        mode: 'Dedicated',
        dedicated: {
          nodeType: 'b1',
          scaling: 'Manual',
          manual: { shards: 2, replicas: 3 },
        },
      },
    },
  ])('creates an index with options %j', async (options) => {
    await expect(
      backups.createIndex('backup-123', options),
    ).resolves.toStrictEqual(restore);
    expect(api.createIndexFromBackupOperation).toHaveBeenCalledTimes(1);
    expect(api.createIndexFromBackupOperation).toHaveBeenCalledWith({
      backupId: 'backup-123',
      createIndexFromBackupRequest: {
        name: options.name,
        tags: options.tags,
        deletionProtection: options.deletionProtection,
        readCapacity: options.readCapacity,
      },
      xPineconeApiVersion: '2026-07',
    });
  });

  const invalidCalls = [
    ['create', 'indexName', (b: Backups, value: string) => b.create(value)],
    [
      'listByIndex',
      'indexName',
      (b: Backups, value: string) => b.listByIndex(value),
    ],
    ['describe', 'backupId', (b: Backups, value: string) => b.describe(value)],
    ['delete', 'backupId', (b: Backups, value: string) => b.delete(value)],
    [
      'createIndex backup',
      'backupId',
      (b: Backups, value: string) => b.createIndex(value, { name: 'restored' }),
    ],
    [
      'createIndex name',
      'name',
      (b: Backups, value: string) =>
        b.createIndex('backup-123', { name: value }),
    ],
  ] as const;
  describe.each(invalidCalls)('%s validation', (_, field, invoke) => {
    test.each(['', undefined, null])(
      'rejects %s before calling the API',
      async (value) => {
        await expect(
          invoke(backups, value as unknown as string),
        ).rejects.toMatchObject({
          name: 'PineconeArgumentError',
          message: expect.stringContaining(`\`${field}\``),
        });
        for (const method of [
          'createBackup',
          'listIndexBackups',
          'describeBackup',
          'deleteBackup',
          'createIndexFromBackupOperation',
        ] as const)
          expect(api[method]).not.toHaveBeenCalled();
      },
    );
  });

  const errorCalls = [
    [
      'createBackup',
      'Error creating backup for index source-index: missing',
      (b: Backups) => b.create('source-index'),
    ],
    [
      'listIndexBackups',
      'Error listing backups for index source-index: missing',
      (b: Backups) => b.listByIndex('source-index'),
    ],
    [
      'listProjectBackups',
      'Error listing project backups: missing',
      (b: Backups) => b.list(),
    ],
    [
      'describeBackup',
      'Error describing backup backup-123: missing',
      (b: Backups) => b.describe('backup-123'),
    ],
    [
      'deleteBackup',
      'Error deleting backup backup-123: missing',
      (b: Backups) => b.delete('backup-123'),
    ],
    [
      'createIndexFromBackupOperation',
      'Error creating index from backup backup-123: missing',
      (b: Backups) => b.createIndex('backup-123', { name: 'restored' }),
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
      await expect(invoke(backups)).rejects.toEqual(
        new PineconeBadRequestError({ status: 400, message }),
      );
    },
  );
  test.each(errorCalls)(
    '%s preserves SDK errors',
    async (method, _, invoke) => {
      const error = new PineconeArgumentError('already mapped');
      jest.mocked(api[method]).mockRejectedValue(error);
      await expect(invoke(backups)).rejects.toBe(error);
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
      await expect(invoke(backups)).rejects.toBeInstanceOf(
        PineconeNotFoundError,
      );
    },
  );
});
