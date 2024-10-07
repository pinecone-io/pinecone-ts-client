import { sleep } from '../../integration/testHelpers';
import { retry } from '../retry';

// Mock only `sleep`, keep other functions in testHelpers.ts as-is
jest.mock('../../integration/testHelpers', () => ({
  ...jest.requireActual('../../integration/testHelpers'),
  sleep: jest.fn().mockResolvedValue(undefined), // Directly mock sleep here
}));

describe('retry function', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  // Unit test
  test('Should call asyncFn once if it succeeds initially', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const result = await retry(asyncFn);
    expect(asyncFn).toHaveBeenCalledTimes(1);
    expect(result).toBe('success');
  });

  // Unit test
  test('Should retry if asyncFn fails initially but eventually succeeds', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First try failed'))
      .mockResolvedValue('success');

    const result = await retry(asyncFn);
    expect(asyncFn).toHaveBeenCalledTimes(2);
    expect(result).toBe('success');
  });

  // Unit Test
  test('Should throw an error if maxRetries is reached', async () => {
    const asyncFn = jest.fn().mockRejectedValue(new Error('Some failure'));
    await expect(retry(asyncFn, 3, 10)).rejects.toThrowError('Some failure');
    expect(asyncFn).toHaveBeenCalledTimes(3);
  });

  // Unit Test
  test('Delay should increase exponentially with each retry', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failing function')) // 1st attempt fails
      .mockRejectedValueOnce(new Error('Failing function')) // 2nd attempt fails
      .mockRejectedValueOnce(new Error('Failing function')) // 3rd attempt fails
      .mockResolvedValue('success'); // 4th attempt succeeds

    await retry(asyncFn, 5, 10, sleep);
    expect(sleep).toHaveBeenCalledWith(10);
    expect(sleep).toHaveBeenCalledWith(20);
    expect(sleep).toHaveBeenCalledWith(40);
  });
});
