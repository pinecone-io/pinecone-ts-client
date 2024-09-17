import {
  CancelImportCommand,
  DescribeImportCommand,
  ListImportCommand,
  StartImportCommand,
} from '../bulkImport';
import { BulkOperationsProvider } from '../bulkOperationsProvider';
import {
  ImportErrorModeOnErrorEnum,
  ImportListResponse,
  ImportModel,
  ListImportsRequest,
  StartImportOperationRequest,
  StartImportResponse,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

describe('StartImportCommand', () => {
  let apiProviderMock: jest.Mocked<BulkOperationsProvider>;
  let apiMock: jest.Mocked<any>; // Mocking the API returned by `provide`
  let startImportCommand: StartImportCommand;
  let listImportCommand: ListImportCommand;
  let describeImportCommand: DescribeImportCommand;
  let cancelImportCommand: CancelImportCommand;

  beforeEach(() => {
    apiMock = {
      startImport: jest.fn(),
      listImports: jest.fn(),
      describeImport: jest.fn(),
      cancelImport: jest.fn(),
    };

    apiProviderMock = {
      provide: jest.fn().mockResolvedValue(apiMock),
    } as unknown as jest.Mocked<BulkOperationsProvider>;

    startImportCommand = new StartImportCommand(apiProviderMock, '');
    listImportCommand = new ListImportCommand(apiProviderMock, '');
    describeImportCommand = new DescribeImportCommand(apiProviderMock, '');
    cancelImportCommand = new CancelImportCommand(apiProviderMock, '');
  });

  test('should call startImport with correct request when errorMode is "continue"', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'continue';

    const expectedRequest: StartImportOperationRequest = {
      startImportRequest: {
        uri,
        errorMode: { onError: ImportErrorModeOnErrorEnum.Continue },
      },
    };

    const response = {} as StartImportResponse; // Mock the response
    apiMock.startImport.mockResolvedValue(response);

    const result = await startImportCommand.run(uri, errorMode);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startImport).toHaveBeenCalledWith(expectedRequest);
    expect(result).toBe(response);
  });

  test('should call startImport with correct request when errorMode is "abort"', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'abort';

    const expectedRequest: StartImportOperationRequest = {
      startImportRequest: {
        uri,
        errorMode: { onError: ImportErrorModeOnErrorEnum.Abort },
      },
    };

    const response = {} as StartImportResponse;
    apiMock.startImport.mockResolvedValue(response);

    const result = await startImportCommand.run(uri, errorMode);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startImport).toHaveBeenCalledWith(expectedRequest);
    expect(result).toBe(response);
  });

  test('should throw PineconeArgumentError for invalid errorMode', async () => {
    const uri = 's3://my-bucket/my-file.csv';
    const errorMode = 'invalid';

    await expect(startImportCommand.run(uri, errorMode)).rejects.toThrow(
      PineconeArgumentError
    );

    expect(apiMock.startImport).not.toHaveBeenCalled();
  });

  test('should use "continue" as default when errorMode is undefined', async () => {
    const uri = 's3://my-bucket/my-file.csv';

    const expectedRequest: StartImportOperationRequest = {
      startImportRequest: {
        uri,
        errorMode: { onError: ImportErrorModeOnErrorEnum.Continue },
      },
    };

    const response = {} as StartImportResponse;
    apiMock.startImport.mockResolvedValue(response);

    const result = await startImportCommand.run(uri, undefined);

    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.startImport).toHaveBeenCalledWith(expectedRequest);
    expect(result).toBe(response);
  });

  test('should call listImport with correct request', async () => {
    const limit = 1;

    const expectedRequest: ListImportsRequest = {
      limit,
    };
    const response = {} as unknown as ImportListResponse;

    apiMock.listImports.mockResolvedValue(response);
    const result = await listImportCommand.run(limit);
    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.listImports).toHaveBeenCalledWith(expectedRequest);
    expect(result).toBe(response);
  });

  test('should call describeImport with correct request', async () => {
    const importId = 'import-id';
    const req = { id: importId };
    const response = {} as unknown as ImportModel;

    apiMock.describeImport.mockResolvedValue(response);

    const result = await describeImportCommand.run(importId);
    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.describeImport).toHaveBeenCalledWith(req);
    expect(result).toBe(response);
  });

  test('should call cancelImport with correct request', async () => {
    const importId = 'import-id';
    const req = { id: importId };
    const response = {};

    apiMock.cancelImport.mockResolvedValue(response);

    const result = await cancelImportCommand.run(importId);
    expect(apiProviderMock.provide).toHaveBeenCalled();
    expect(apiMock.cancelImport).toHaveBeenCalledWith(req);
    expect(result).toBe(response);
  });
});
