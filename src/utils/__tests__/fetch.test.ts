import { getFetch } from '../fetch';
import { PineconeConfigurationError } from '../../errors';
import type { PineconeConfiguration } from '../../data';

describe('getFetch', () => {
  afterEach(() => {
    // Reset global.fetch after each test to avoid affecting other tests
    delete (global as any).fetch;
  });

  test('should wrap the user-provided fetch implementation if provided', async () => {
    const customFetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
    });
    const config = {
      apiKey: 'some-api-key',
      fetchApi: customFetch,
    } as PineconeConfiguration;

    const fetchFn = getFetch(config);

    // The returned function should be a wrapper, not the original
    expect(fetchFn).not.toBe(customFetch);

    // But it should call the underlying fetch
    await fetchFn('https://example.com', {});
    expect(customFetch).toHaveBeenCalledWith('https://example.com', {});
  });

  test('should wrap the global fetch implementation if user-provided fetch is not present', async () => {
    const globalFetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
    });
    (global as any).fetch = globalFetch;

    const config = {
      apiKey: 'some-api-key',
      fetchApi: undefined,
    } as PineconeConfiguration;

    const fetchFn = getFetch(config);

    // The returned function should be a wrapper, not the original
    expect(fetchFn).not.toBe(globalFetch);

    // But it should call the underlying fetch
    await fetchFn('https://example.com', {});
    expect(globalFetch).toHaveBeenCalledWith('https://example.com', {});
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
