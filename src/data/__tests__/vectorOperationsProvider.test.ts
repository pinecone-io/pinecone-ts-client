import { VectorOperationsProvider } from '../vectorOperationsProvider';
import { IndexHostSingleton } from '../indexHostSingleton';

describe('VectorOperationsProvider', () => {
  let real;

  beforeAll(() => {
    real = IndexHostSingleton.getHostUrl;
  });
  afterAll(() => {
    IndexHostSingleton.getHostUrl = real;
  });
  beforeEach(() => {
    IndexHostSingleton.getHostUrl = jest.fn();
  });
  afterEach(() => {
    IndexHostSingleton._reset();
  });

  test('makes no API calls on instantiation', async () => {
    const config = {
      apiKey: 'test-api-key',
    };
    new VectorOperationsProvider(config, 'index-name');
    expect(IndexHostSingleton.getHostUrl).not.toHaveBeenCalled();
  });

  test('api calls occur only the first time the provide method is called', async () => {
    const config = {
      apiKey: 'test-api-key',
    };
    const provider = new VectorOperationsProvider(config, 'index-name');
    expect(IndexHostSingleton.getHostUrl).not.toHaveBeenCalled();

    const api = await provider.provide();
    expect(IndexHostSingleton.getHostUrl).toHaveBeenCalled();

    const api2 = await provider.provide();
    expect(IndexHostSingleton.getHostUrl).toHaveBeenCalledTimes(1);
    expect(api).toEqual(api2);
  });

  test('passing indexHostUrl skips hostUrl resolution', async () => {
    const config = {
      apiKey: 'test-api-key',
    };
    const indexHostUrl = 'http://index-host-url';
    const provider = new VectorOperationsProvider(
      config,
      'index-name',
      indexHostUrl
    );

    jest.spyOn(provider, 'buildVectorOperationsConfig');

    await provider.provide();

    expect(IndexHostSingleton.getHostUrl).not.toHaveBeenCalled();
    expect(provider.buildVectorOperationsConfig).toHaveBeenCalledWith({
      ...config,
      hostUrl: indexHostUrl,
    });
  });
});
