import { VectorOperationsProvider } from '../vectorOperationsProvider';
import { ProjectIdSingleton } from '../projectIdSingleton';

describe('VectorOperationsProvider', () => {
  let real;

  beforeAll(() => {
    real = ProjectIdSingleton.getProjectId;
  });
  afterAll(() => {
    ProjectIdSingleton.getProjectId = real;
  });
  beforeEach(() => {
    ProjectIdSingleton.getProjectId = jest.fn();
  });
  afterEach(() => {
    ProjectIdSingleton._reset();
  });

  test('makes no API calls on instantiation', async () => {
    const config = {
      apiKey: 'test-api-key',
      environment: 'gcp-free',
    };
    new VectorOperationsProvider(config, 'index-name');
    expect(ProjectIdSingleton.getProjectId).not.toHaveBeenCalled();
  });

  test('api calls occur only the first time the provide method is called', async () => {
    const config = {
      apiKey: 'test-api-key',
      environment: 'gcp-free',
    };
    const provider = new VectorOperationsProvider(config, 'index-name');
    expect(ProjectIdSingleton.getProjectId).not.toHaveBeenCalled();

    const api = await provider.provide();
    expect(ProjectIdSingleton.getProjectId).toHaveBeenCalled();

    const api2 = await provider.provide();
    expect(ProjectIdSingleton.getProjectId).toHaveBeenCalledTimes(1);
    expect(api).toEqual(api2);
  });
});
