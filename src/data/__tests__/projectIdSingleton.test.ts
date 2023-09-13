import { ProjectIdSingleton } from '../projectIdSingleton';
import crossFetch from 'cross-fetch';

jest.mock('cross-fetch', () => {
  //Mock the default export
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe('ProjectIdSingleton', () => {
  afterEach(() => {
    ProjectIdSingleton._reset();
  });

  test('issues whoami requests for unknown projectId', async () => {
    // @ts-ignore
    crossFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ project_name: 'abcdef' }),
    });

    const testApiKey = 'api-key-1';
    const testConfig = {
      apiKey: testApiKey,
      environment: 'gcp-free',
    };

    const id = await ProjectIdSingleton.getProjectId(testConfig);

    expect(id).toEqual('abcdef');
    expect(crossFetch).toHaveBeenCalledWith(
      'https://controller.gcp-free.pinecone.io/actions/whoami',
      {
        headers: {
          'Api-Key': testApiKey,
          'Content-Type': 'application/json',
          'User-Agent': expect.stringContaining('@pinecone-database/pinecone'),
        },
        method: 'GET',
      }
    );
  });

  test('only makes API call once per api key', async () => {
    // @ts-ignore
    crossFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ project_name: 'xyzxyz' }),
    });

    const testApiKey = 'api-key-2';
    const testConfig2 = {
      apiKey: testApiKey,
      environment: 'gcp-free',
    };

    const id = await ProjectIdSingleton.getProjectId(testConfig2);
    expect(id).toEqual('xyzxyz');
    expect(crossFetch).toHaveBeenCalledTimes(1);

    const id2 = await ProjectIdSingleton.getProjectId(testConfig2);
    expect(id2).toEqual('xyzxyz');
    expect(crossFetch).toHaveBeenCalledTimes(1);

    await ProjectIdSingleton.getProjectId(testConfig2);
    await ProjectIdSingleton.getProjectId(testConfig2);
    await ProjectIdSingleton.getProjectId(testConfig2);
    expect(crossFetch).toHaveBeenCalledTimes(1);
  });
});
