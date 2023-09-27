import { ProjectIdSingleton } from '../projectIdSingleton';
import * as utils from '../../utils';
import type { PineconeConfiguration } from '../types';

const fakeFetch = jest.fn();

jest.mock('../../utils', () => {
  const realUtils = jest.requireActual('../../utils');

  return {
    ...realUtils,
    getFetch: () => fakeFetch,
  };
});

describe('ProjectIdSingleton', () => {
  const fetch = utils.getFetch({} as PineconeConfiguration);

  afterEach(() => {
    ProjectIdSingleton._reset();
    fakeFetch.mockReset();
  });

  test('issues whoami requests for unknown projectId', async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
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
    expect(fetch).toHaveBeenCalledWith(
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
    utils.getFetch({} as PineconeConfiguration).mockResolvedValue({
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
    expect(fetch).toHaveBeenCalledTimes(1);

    const id2 = await ProjectIdSingleton.getProjectId(testConfig2);
    expect(id2).toEqual('xyzxyz');
    expect(fetch).toHaveBeenCalledTimes(1);

    await ProjectIdSingleton.getProjectId(testConfig2);
    await ProjectIdSingleton.getProjectId(testConfig2);
    await ProjectIdSingleton.getProjectId(testConfig2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
