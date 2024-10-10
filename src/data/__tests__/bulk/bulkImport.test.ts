import { StartImportCommand } from '../../bulk/startImport';
import { ListImportsCommand } from '../../bulk/listImports';
import { DescribeImportCommand } from '../../bulk/describeImport';
import { CancelImportCommand } from '../../bulk/cancelImport';
import { BulkOperationsProvider } from '../../bulk/bulkOperationsProvider';
import {
  ImportErrorModeOnErrorEnum,
  ListBulkImportsRequest,
  StartBulkImportRequest,
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
      describeImport: jest.fn(),
      cancelBulkImport: jest.fn(),
    };

    apiProviderMock = {
      provide: jest.fn().mockResolvedValue(apiMock),
    } as unknown as jest.Mocked<BulkOperationsProvider>;

    startImportCommand = new StartImportCommand(apiProviderMock, '');
    listImportCommand = new ListImportsCommand(apiProviderMock, '');
    describeImportCommand = new DescribeImportCommand(apiProviderMock, '');
    cancelImportCommand = new CancelImportCommand(apiProviderMock, '');
  });

  test('should call startBulkImport with correct request when errorMode is "continue"', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'continue';

    const expectedRequest: StartBulkImportRequest = {
      startImportRequest: {
        uri,
        errorMode: { onError: ImportErrorModeOnErrorEnum.Continue },
      },
    };

    await startImportCommand.run(uri, errorMode);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startBulkImport).toHaveBeenCalledWith(expectedRequest);
  });

  test('should call startBulkImport with correct request when errorMode is "abort"', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'abort';

    const expectedRequest: StartBulkImportRequest = {
      startImportRequest: {
        uri,
        errorMode: { onError: ImportErrorModeOnErrorEnum.Abort },
      },
    };

    await startImportCommand.run(uri, errorMode);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startBulkImport).toHaveBeenCalledWith(expectedRequest);
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

    const expectedRequest: StartBulkImportRequest = {
      startImportRequest: {
        uri,
        errorMode: { onError: ImportErrorModeOnErrorEnum.Continue },
      },
    };

    await startImportCommand.run(uri, undefined);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startBulkImport).toHaveBeenCalledWith(expectedRequest);
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

    const expectedRequest: ListBulkImportsRequest = {
      limit,
    };

    await listImportCommand.run(limit);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.listBulkImports).toHaveBeenCalledWith(expectedRequest);
  });

  test('should call describeImport with correct request', async () => {
    const importId = 'import-id';
    const req = { id: importId };

    await describeImportCommand.run(importId);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.describeImport).toHaveBeenCalledWith(req);
  });

  test('should call cancelBulkImport with correct request', async () => {
    const importId = 'import-id';
    const req = { id: importId };

    await cancelImportCommand.run(importId);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.cancelBulkImport).toHaveBeenCalledWith(req);
  });
});
