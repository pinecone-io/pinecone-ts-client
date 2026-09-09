import {
  pollUntilIndexIsReady,
  IndexReadinessResponse,
} from '../pollUntilIndexIsReady';
import { PineconeTimeoutError } from '../../errors';

describe('pollUntilIndexIsReady', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns an immediately ready response without scheduling another poll', async () => {
    const ready = {
      status: { ready: true, state: 'Ready' },
      host: 'ready.example.com',
    };
    const describe = jest.fn().mockResolvedValue(ready);
    await expect(pollUntilIndexIsReady(describe, 'index')).resolves.toBe(ready);
    expect(describe).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each<IndexReadinessResponse>([
    {},
    { status: {} },
    { status: { ready: false, state: 'FutureTransitionalState' } },
  ])(
    'continues through incomplete or unknown status %j with no timeout',
    async (pending) => {
      const ready = { status: { ready: true, state: 'Ready' } };
      const describe = jest
        .fn()
        .mockResolvedValueOnce(pending)
        .mockResolvedValueOnce(pending)
        .mockResolvedValue(ready);
      const result = pollUntilIndexIsReady(describe, 'index', undefined, 100);
      await jest.advanceTimersByTimeAsync(199);
      expect(describe).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toBe(ready);
      expect(describe).toHaveBeenCalledTimes(3);
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it('reports the index and configured deadline when polling times out', async () => {
    const describe = jest
      .fn()
      .mockResolvedValue({ status: { ready: false, state: 'Initializing' } });
    const result = pollUntilIndexIsReady(describe, 'waiting-index', 200, 100);
    const assertion = expect(result).rejects.toEqual(
      new PineconeTimeoutError('waiting-index', 200),
    );
    await jest.advanceTimersByTimeAsync(200);
    await assertion;
    expect(describe).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('passes through a describe rejection without retrying', async () => {
    const error = new Error('describe failed');
    const describe = jest.fn().mockRejectedValue(error);
    await expect(pollUntilIndexIsReady(describe, 'index')).rejects.toBe(error);
    expect(describe).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
