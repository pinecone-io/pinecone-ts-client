import { listFiles } from '../listFiles';
import { describeFile } from '../describeFile';
import { deleteFile } from '../deleteFile';
import {
  ListFilesRequest,
  ListFiles200Response,
  DescribeFileRequest,
  AssistantFileModel,
  DeleteFileRequest,
  ManageAssistantsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';

const setupApiProvider = () => {
  const fakeListFiles: (
    req: ListFilesRequest,
  ) => Promise<ListFiles200Response> = jest.fn().mockImplementation(() =>
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

  const fakeDeleteFile: (req: DeleteFileRequest) => Promise<void> = jest
    .fn()
    .mockImplementation(() => Promise.resolve());

  const MAP = {
    listFiles: fakeListFiles,
    describeFile: fakeDescribeFile,
    deleteFile: fakeDeleteFile,
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

  test('resolves successfully when delete completes', async () => {
    const deleteFileFn = deleteFile('test-assistant', asstOperationsProvider);
    await expect(deleteFileFn('file-id-1')).resolves.toBeUndefined();
  });
});
