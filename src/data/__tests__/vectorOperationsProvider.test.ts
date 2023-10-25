import { VectorOperationsProvider } from '../vectorOperationsProvider';
import { HostUrlSingleton } from '../hostUrlSingleton';

describe('VectorOperationsProvider', () => {
  let real;

  beforeAll(() => {
    real = HostUrlSingleton.getHostUrl;
  });
  afterAll(() => {
    HostUrlSingleton.getHostUrl = real;
  });
  beforeEach(() => {
    HostUrlSingleton.getHostUrl = jest.fn();
  });
  afterEach(() => {
    HostUrlSingleton._reset();
  });

  test('makes no API calls on instantiation', async () => {
    const config = {
      apiKey: 'test-api-key',
      environment: 'gcp-free',
    };
    new VectorOperationsProvider(config, 'index-name');
    expect(HostUrlSingleton.getHostUrl).not.toHaveBeenCalled();
  });

  test('api calls occur only the first time the provide method is called', async () => {
    const config = {
      apiKey: 'test-api-key',
      environment: 'gcp-free',
    };
    const provider = new VectorOperationsProvider(config, 'index-name');
    expect(HostUrlSingleton.getHostUrl).not.toHaveBeenCalled();

    const api = await provider.provide();
    expect(HostUrlSingleton.getHostUrl).toHaveBeenCalled();

    const api2 = await provider.provide();
    expect(HostUrlSingleton.getHostUrl).toHaveBeenCalledTimes(1);
    expect(api).toEqual(api2);
  });
});
