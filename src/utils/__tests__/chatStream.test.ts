import { Readable } from 'stream';
import { ChatStream } from '../../assistant/chatStream';
import { convertKeysToCamelCase } from '../convertKeys';

jest.mock('../convertKeys');

type MockStreamData = { [key: string]: string };

describe('ChatStream', () => {
  let convertKeysMock: jest.Mock;

  beforeEach(() => {
    convertKeysMock = convertKeysToCamelCase as jest.Mock;
    convertKeysMock.mockImplementation((json) => json);
  });

  test('yields converted JSON from data stream chunks', async () => {
    const stream = Readable.from([
      'data: {"key": "value"}\n',
      'data: {"key2": "value2"}\n',
    ]);
    const chatStream = new ChatStream<MockStreamData>(stream);

    const chunks: MockStreamData[] = [];
    for await (const chunk of chatStream) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([{ key: 'value' }, { key2: 'value2' }]);
    expect(chunks.length).toBe(2);
    expect(convertKeysMock).toHaveBeenCalledTimes(2);
  });

  test('skips malformed chunks', async () => {
    const stream = Readable.from([
      'data: {"key": "value"}\n',
      'nothing_wrong\n',
      'data: {"key2": "value2"}\n',
    ]);
    const chatStream = new ChatStream<MockStreamData>(stream);

    const chunks: MockStreamData[] = [];
    for await (const chunk of chatStream) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([{ key: 'value' }, { key2: 'value2' }]);
    expect(chunks.length).toBe(2);
    expect(convertKeysMock).toHaveBeenCalledTimes(2);
  });

  test('skips malformed JSON', async () => {
    const stream = Readable.from([
      'data: {"key": "value"}\n',
      'data: malformed_json\n',
      'data: {"key3": "value3"}\n',
    ]);
    const chatStream = new ChatStream<MockStreamData>(stream);

    const chunks: MockStreamData[] = [];
    for await (const chunk of chatStream) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([{ key: 'value' }, { key3: 'value3' }]);
    expect(chunks.length).toBe(2);
    expect(convertKeysMock).toHaveBeenCalledTimes(2);
  });
});
