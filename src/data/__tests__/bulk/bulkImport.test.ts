import { StartImportCommand } from '../../bulk/startImport';
import { ListImportsCommand } from '../../bulk/listImports';
import { DescribeImportCommand } from '../../bulk/describeImport';
import { CancelImportCommand } from '../../bulk/cancelImport';
import { BulkOperationsProvider } from '../../bulk/bulkOperationsProvider';
import {
  ListBulkImportsRequest,
  StartBulkImportRequest,
  StartImportResponse,
  CancelBulkImportRequest,
  ListImportsResponse,
  DescribeBulkImportRequest,
  BulkOperationsApi,
  ImportModel,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../../errors';

const setupResponse = (response, isSuccess) => {
  const fakeStartImport: (
    req: StartBulkImportRequest,
  ) => Promise<StartImportResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const fakeListImports: (
    req: ListBulkImportsRequest,
  ) => Promise<ListImportsResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const fakeDescribeImport: (
    req: DescribeBulkImportRequest,
  ) => Promise<ImportModel> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const fakeCancelImport: (req: CancelBulkImportRequest) => Promise<object> =
    jest
      .fn()
      .mockImplementation(() =>
        isSuccess ? Promise.resolve(response) : Promise.reject(response),
      );

  const BOA = {
    startBulkImport: fakeStartImport,
    listBulkImports: fakeListImports,
    describeBulkImport: fakeDescribeImport,
    cancelBulkImport: fakeCancelImport,
  } as BulkOperationsApi;

  const BulkOperationsProvider = {
    provide: async () => BOA,
  } as BulkOperationsProvider;

  const startCmd = new StartImportCommand(BulkOperationsProvider);
  const listCmd = new ListImportsCommand(BulkOperationsProvider);
  const describeCmd = new DescribeImportCommand(BulkOperationsProvider);
  const cancelCmd = new CancelImportCommand(BulkOperationsProvider);

  return {
    fakeStartImport,
    fakeListImports,
    fakeDescribeImport,
    fakeCancelImport,
    BOA,
    BulkOperationsProvider,
    startCmd,
    listCmd,
    describeCmd,
    cancelCmd,
  };
};

describe('StartImportCommand', () => {
  test('should call startImport with correct request when errorMode is "continue"', async () => {
    const { startCmd, fakeStartImport } = setupResponse({ id: '1' }, true);

    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'continue';

    await startCmd.run(uri, errorMode);

    expect(fakeStartImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        startImportRequest: {
          uri,
          errorMode: { onError: 'continue' },
        },
      }),
    );
  });

  test('should call startImport with correct request when errorMode is "abort"', async () => {
    const { startCmd, fakeStartImport } = setupResponse({ id: '1' }, true);

    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'abort';

    await startCmd.run(uri, errorMode);

    expect(fakeStartImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        startImportRequest: {
          uri,
          errorMode: { onError: 'abort' },
        },
      }),
    );
  });

  test('should throw PineconeArgumentError for invalid errorMode', async () => {
    const { startCmd } = setupResponse({ id: '1' }, false);

    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'invalid';

    await expect(startCmd.run(uri, errorMode)).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('should use "continue" as default when errorMode is undefined', async () => {
    const { startCmd, fakeStartImport } = setupResponse({ id: '1' }, true);

    const uri = 's3://my-bucket/my-file.csv';

    await startCmd.run(uri, undefined);

    expect(fakeStartImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        startImportRequest: {
          uri,
          errorMode: { onError: 'continue' },
        },
      }),
    );
  });

  test('should throw error when URI/1st arg is missing', async () => {
    const { startCmd } = setupResponse(undefined, false);

    await expect(startCmd.run('')).rejects.toThrow(PineconeArgumentError);
    await expect(startCmd.run('')).rejects.toThrow(
      '`uri` field is required and must start with the scheme of a supported storage provider.',
    );
  });

  test('should call listImport with correct request', async () => {
    const { listCmd, fakeListImports } = setupResponse({ imports: [] }, true);

    const limit = 1;

    await listCmd.run(limit);

    expect(fakeListImports).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        limit,
      }),
    );
  });

  test('should call describeImport with correct request', async () => {
    const { describeCmd, fakeDescribeImport } = setupResponse(
      { id: '1' },
      true,
    );

    const importId = 'import-id';

    await describeCmd.run(importId);

    expect(fakeDescribeImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        id: importId,
      }),
    );
  });

  test('should call cancelImport with correct request', async () => {
    const { cancelCmd, fakeCancelImport } = setupResponse({ id: '1' }, true);

    const importId = 'import-id';

    await cancelCmd.run(importId);

    expect(fakeCancelImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        id: importId,
      }),
    );
  });
});
