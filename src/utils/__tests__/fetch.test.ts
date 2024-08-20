import { getFetch } from '../fetch';
import { PineconeConfigurationError } from '../../errors';
import type { PineconeConfiguration } from '../../data';

describe('getFetch', () => {
  afterEach(() => {
    console.log('resetting global.fetch');
    // Reset global.fetch after each test to avoid affecting other tests
    delete (global as any).fetch;
  });

  test('should return the user-provided fetch implementation if provided', () => {
    const customFetch = jest.fn();
    const config = {
      apiKey: 'some-api-key',
      fetchApi: customFetch,
    } as PineconeConfiguration;

    const fetchFn = getFetch(config);

    expect(fetchFn).toBe(customFetch);
  });

  test('should return the global fetch implementation if user-provided fetch is not present', () => {
    const globalFetch = jest.fn();
    (global as any).fetch = globalFetch;

    const config = {
      apiKey: 'some-api-key',
      fetchApi: undefined,
    } as PineconeConfiguration;

    const fetchFn = getFetch(config);

    expect(fetchFn).toBe(globalFetch);
  });

  test('should throw a PineconeConfigurationError if no fetch implementation is found', () => {
    const config = {
      apiKey: 'some-api-key',
      fetchApi: undefined,
    } as PineconeConfiguration;

    expect(() => getFetch(config)).toThrow(PineconeConfigurationError);
    expect(() => getFetch(config)).toThrow(
      'No global or user-provided fetch implementations found. Please supply a fetch implementation.'
    );
  });
});
