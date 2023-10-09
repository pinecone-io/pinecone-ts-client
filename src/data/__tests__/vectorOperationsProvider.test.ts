import { VectorOperationsProvider } from '../vectorOperationsProvider';
import { DataUrlSingleton } from '../dataUrlSingleton';
import { Pinecone } from '../../pinecone';

describe('VectorOperationsProvider', () => {
  let real;

  beforeAll(() => {
    real = DataUrlSingleton.getDataUrl;
  });
  afterAll(() => {
    DataUrlSingleton.getDataUrl = real;
  });
  beforeEach(() => {
    DataUrlSingleton.getDataUrl = jest.fn();
  });
  afterEach(() => {
    DataUrlSingleton._reset();
  });

  test('makes no API calls on instantiation', async () => {
    const config = {
      apiKey: 'test-api-key',
      environment: 'gcp-free',
    };
    new VectorOperationsProvider(new Pinecone(config), 'index-name');
    expect(DataUrlSingleton.getDataUrl).not.toHaveBeenCalled();
  });

  test('api calls occur only the first time the provide method is called', async () => {
    const config = {
      apiKey: 'test-api-key',
      environment: 'gcp-free',
    };
    const provider = new VectorOperationsProvider(
      new Pinecone(config),
      'index-name'
    );
    expect(DataUrlSingleton.getDataUrl).not.toHaveBeenCalled();

    const api = await provider.provide();
    expect(DataUrlSingleton.getDataUrl).toHaveBeenCalled();

    const api2 = await provider.provide();
    expect(DataUrlSingleton.getDataUrl).toHaveBeenCalledTimes(1);
    expect(api).toEqual(api2);
  });
});
