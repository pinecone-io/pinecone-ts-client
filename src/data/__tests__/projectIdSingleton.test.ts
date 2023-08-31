import { ProjectIdSingleton } from '../projectIdSingleton';

describe('ProjectIdSingleton', () => {
  afterEach(() => {
    ProjectIdSingleton._reset();
  });

  test('issues whoami requests for unknown projectId', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ project_name: 'abcdef' }),
      })
    );

    const testApiKey = 'api-key-1';
    const testConfig = {
      apiKey: testApiKey,
      environment: 'gcp-free',
    };

    const id = await ProjectIdSingleton.getProjectId(testConfig);

    expect(id).toEqual('abcdef');
    expect(global.fetch).toHaveBeenCalledWith(
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
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ project_name: 'xyzxyz' }),
      })
    );

    const testApiKey = 'api-key-2';
    const testConfig2 = {
      apiKey: testApiKey,
      environment: 'gcp-free',
    };

    const id = await ProjectIdSingleton.getProjectId(testConfig2);
    expect(id).toEqual('xyzxyz');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const id2 = await ProjectIdSingleton.getProjectId(testConfig2);
    expect(id2).toEqual('xyzxyz');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await ProjectIdSingleton.getProjectId(testConfig2);
    await ProjectIdSingleton.getProjectId(testConfig2);
    await ProjectIdSingleton.getProjectId(testConfig2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
