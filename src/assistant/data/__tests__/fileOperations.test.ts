import { listFiles } from '../listFiles';
import { describeFile } from '../describeFile';
import { deleteFile } from '../deleteFile';
import { describeOperation } from '../describeOperation';
import { listOperations } from '../listOperations';
import {
  ListFilesRequest,
  ListFilesResponse,
  DescribeFileRequest,
  AssistantFileModel,
  DeleteFileRequest,
  DescribeOperationRequest,
  ListOperationsRequest,
  OperationList,
  ManageAssistantsApi,
  OperationModel,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';
import { PineconeArgumentError } from '../../../errors';

const setupApiProvider = () => {
  const fakeListFiles: (req: ListFilesRequest) => Promise<ListFilesResponse> =
    jest.fn().mockImplementation(() =>
      Promise.resolve({
        files: [
          {
            name: 'file1.txt',
            id: 'file-id-1',
            status: 'Available',
            createdOn: new Date(),
            updatedOn: new Date(),
          },
          {
            name: 'file2.pdf',
            id: 'file-id-2',
            status: 'Processing',
            createdOn: new Date(),
            updatedOn: new Date(),
            multimodal: true,
          },
        ],
      }),
    );

  const fakeDescribeFile: (
    req: DescribeFileRequest,
  ) => Promise<AssistantFileModel> = jest.fn().mockImplementation(() =>
    Promise.resolve({
      name: 'file1.txt',
      id: 'file-id-1',
      status: 'Available',
      metadata: { key: 'value' },
      createdOn: new Date(),
      updatedOn: new Date(),
      percentDone: 100,
      signedUrl: 'https://signed-url.com',
      multimodal: false,
    }),
  );

  const mockDeleteOp: OperationModel = {
    id: 'op-delete-id',
    fileId: 'file-id-1',
    status: 'Processing',
    operationType: 'delete_file',
    createdOn: new Date(),
  };
  const fakeDeleteFile: (req: DeleteFileRequest) => Promise<OperationModel> =
    jest.fn().mockResolvedValue(mockDeleteOp);

  const mockOperation: OperationModel = {
    id: 'op-id-1',
    fileId: 'file-id-1',
    status: 'Completed',
    operationType: 'upload_file',
    createdOn: new Date(),
  };
  const fakeDescribeOperation: (
    req: DescribeOperationRequest,
  ) => Promise<OperationModel> = jest.fn().mockResolvedValue(mockOperation);

  const mockOperationList: OperationList = {
    operations: [mockOperation],
  };
  const fakeListOperations: (
    req: ListOperationsRequest,
  ) => Promise<OperationList> = jest.fn().mockResolvedValue(mockOperationList);

  const MAP = {
    listFiles: fakeListFiles,
    describeFile: fakeDescribeFile,
    deleteFile: fakeDeleteFile,
    describeOperation: fakeDescribeOperation,
    listOperations: fakeListOperations,
  } as ManageAssistantsApi;
  const AsstDataOperationsProvider = {
    provideData: async () => MAP,
  } as AsstDataOperationsProvider;
  return { MAP, AsstDataOperationsProvider };
};

describe('listFiles', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('calls listFiles without filter', async () => {
    const listFilesFn = listFiles('test-assistant', asstOperationsProvider);
    await listFilesFn({});

    expect(mockApi.listFiles).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      filter: undefined,
    });
  });

  test('calls listFiles with filter', async () => {
    const listFilesFn = listFiles('test-assistant', asstOperationsProvider);
    await listFilesFn({ filter: { category: 'docs' } });

    expect(mockApi.listFiles).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      filter: JSON.stringify({ category: 'docs' }),
    });
  });
});

describe('describeFile', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('calls describeFile with default includeUrl=true', async () => {
    const describeFileFn = describeFile(
      'test-assistant',
      asstOperationsProvider,
    );
    await describeFileFn('file-id-1', true);

    expect(mockApi.describeFile).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      assistantFileId: 'file-id-1',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      includeUrl: 'true',
    });
  });

  test('calls describeFile with includeUrl=false', async () => {
    const describeFileFn = describeFile(
      'test-assistant',
      asstOperationsProvider,
    );
    await describeFileFn('file-id-1', false);

    expect(mockApi.describeFile).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      assistantFileId: 'file-id-1',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      includeUrl: 'false',
    });
  });
});

describe('deleteFile', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('calls deleteFile with correct parameters', async () => {
    const deleteFileFn = deleteFile('test-assistant', asstOperationsProvider);
    await deleteFileFn('file-id-1');

    expect(mockApi.deleteFile).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      assistantFileId: 'file-id-1',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('returns OperationModel on success', async () => {
    const deleteFileFn = deleteFile('test-assistant', asstOperationsProvider);
    const result = await deleteFileFn('file-id-1');
    expect(result.id).toBeDefined();
    expect(result.status).toBeDefined();
  });
});

describe('describeOperation', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('calls describeOperation with correct parameters', async () => {
    const describeOperationFn = describeOperation(
      'test-assistant',
      asstOperationsProvider,
    );
    await describeOperationFn('op-id-1');

    expect(mockApi.describeOperation).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      operationId: 'op-id-1',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('returns OperationModel on success', async () => {
    const describeOperationFn = describeOperation(
      'test-assistant',
      asstOperationsProvider,
    );
    const result = await describeOperationFn('op-id-1');
    expect(result.id).toBeDefined();
    expect(result.status).toBeDefined();
  });

  test('throws when operationId is empty', async () => {
    const describeOperationFn = describeOperation(
      'test-assistant',
      asstOperationsProvider,
    );
    await expect(describeOperationFn('')).rejects.toThrow(
      PineconeArgumentError,
    );
    expect(mockApi.describeOperation).not.toHaveBeenCalled();
  });
});

describe('listOperations', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('calls listOperations with no filters', async () => {
    const listOperationsFn = listOperations(
      'test-assistant',
      asstOperationsProvider,
    );
    await listOperationsFn({});

    expect(mockApi.listOperations).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      operationType: undefined,
      status: undefined,
      limit: undefined,
      paginationToken: undefined,
    });
  });

  test('calls listOperations with filters', async () => {
    const listOperationsFn = listOperations(
      'test-assistant',
      asstOperationsProvider,
    );
    await listOperationsFn({
      operationType: 'upload_file',
      status: 'Processing',
      limit: 10,
      paginationToken: 'token-1',
    });

    expect(mockApi.listOperations).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      operationType: 'upload_file',
      status: 'Processing',
      limit: 10,
      paginationToken: 'token-1',
    });
  });

  test('returns OperationList on success', async () => {
    const listOperationsFn = listOperations(
      'test-assistant',
      asstOperationsProvider,
    );
    const result = await listOperationsFn({});
    expect(result.operations).toBeDefined();
    expect(result.operations?.length).toBeGreaterThan(0);
  });
});
