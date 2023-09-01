import { debugLog } from '../debugLog';

describe('debugLog', () => {
  let consoleLogSpy;
  beforeEach(() => {
    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => jest.fn());
  });

  test('logs when PINECONE_DEBUG is true', () => {
    process.env.PINECONE_DEBUG = 'true';
    debugLog('There was an error!');
    expect(consoleLogSpy).toHaveBeenCalledWith('There was an error!');
  });

  test('does not log when PINECONE_DEBUG is false', () => {
    delete process.env.PINECONE_DEBUG;
    debugLog('There was an error!');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
