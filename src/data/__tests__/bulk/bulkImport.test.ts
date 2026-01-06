import { StartImportCommand } from '../../bulk/startImport';
import { ListImportsCommand } from '../../bulk/listImports';
import { DescribeImportCommand } from '../../bulk/describeImport';
import { CancelImportCommand } from '../../bulk/cancelImport';
import { BulkOperationsProvider } from '../../bulk/bulkOperationsProvider';
import {
  ListBulkImportsRequest,
  StartBulkImportRequest,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../../errors';

describe('StartImportCommand', () => {
  let apiProviderMock: jest.Mocked<BulkOperationsProvider>;
  let apiMock: jest.Mocked<any>; // Mocking the API returned by `provide`
  let startImportCommand: StartImportCommand;
  let listImportCommand: ListImportsCommand;
  let describeImportCommand: DescribeImportCommand;
  let cancelImportCommand: CancelImportCommand;

  beforeEach(() => {
    apiMock = {
      startBulkImport: jest.fn(),
      listBulkImports: jest.fn(),
      describeBulkImport: jest.fn(),
      cancelBulkImport: jest.fn(),
    };

    apiProviderMock = {
      provide: async () => apiMock,
    } as jest.Mocked<BulkOperationsProvider>;

    startImportCommand = new StartImportCommand(apiProviderMock, '');
    listImportCommand = new ListImportsCommand(apiProviderMock, '');
    describeImportCommand = new DescribeImportCommand(apiProviderMock, '');
    cancelImportCommand = new CancelImportCommand(apiProviderMock, '');
  });

  test('should call startImport with correct request when errorMode is "continue"', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'continue';

    const expectedRequest: Partial<StartBulkImportRequest> = {
      startImportRequest: {
        uri,
        errorMode: { onError: 'continue' },
      },
    };

    await startImportCommand.run(uri, errorMode);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startBulkImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        ...expectedRequest,
      })
    );
  });

  test('should call startImport with correct request when errorMode is "abort"', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'abort';

    const expectedRequest: Partial<StartBulkImportRequest> = {
      startImportRequest: {
        uri,
        errorMode: { onError: 'abort' },
      },
    };

    await startImportCommand.run(uri, errorMode);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startBulkImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        ...expectedRequest,
      })
    );
  });

  test('should throw PineconeArgumentError for invalid errorMode', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'invalid';

    await expect(startImportCommand.run(uri, errorMode)).rejects.toThrow(
      PineconeArgumentError
    );

    expect(apiMock.startBulkImport).not.toHaveBeenCalled();
  });

  test('should use "continue" as default when errorMode is undefined', async () => {
    const uri = 's3://my-bucket/my-file.csv';

    const expectedRequest: Partial<StartBulkImportRequest> = {
      startImportRequest: {
        uri,
        errorMode: { onError: 'continue' },
      },
    };

    await startImportCommand.run(uri, undefined);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startBulkImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        ...expectedRequest,
      })
    );
  });

  test('should throw error when URI/1st arg is missing', async () => {
    const toThrow = async () => {
      // @ts-ignore
      await startImportCommand.run();
    };

    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      '`uri` field is required and must start with the scheme of a supported storage provider.'
    );
  });

  test('should call listImport with correct request', async () => {
    const limit = 1;

    const expectedRequest: Partial<ListBulkImportsRequest> = {
      limit,
    };

    await listImportCommand.run(limit);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.listBulkImports).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        ...expectedRequest,
      })
    );
  });

  test('should call describeImport with correct request', async () => {
    const importId = 'import-id';
    const req = { id: importId };

    await describeImportCommand.run(importId);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.describeBulkImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        ...req,
      })
    );
  });

  test('should call cancelImport with correct request', async () => {
    const importId = 'import-id';
    const req = { id: importId };

    await cancelImportCommand.run(importId);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.cancelBulkImport).toHaveBeenCalledWith(
      expect.objectContaining({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        ...req,
      })
    );
  });
});
