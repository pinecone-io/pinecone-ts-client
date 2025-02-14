import { Readable } from 'stream';
import { convertKeysToCamelCase } from '../utils/convertKeys';

/**
 * Implements an async iterable that processes the readable stream of an assistant chat response.
 *
 * This class expects each chunk of data in the stream to begin with `data:` and be followed by a valid chunk of JSON.
 * If a chunk contains malformed JSON, it is skipped, and a debug message is logged.
 *
 * @template Item - The type of items yielded by the iterable.
 */
export class ChatStream<Item> implements AsyncIterable<Item> {
  private stream: Readable;

  constructor(stream: Readable) {
    this.stream = stream;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<Item> {
    let buffer = '';
    for await (const chunk of this.stream) {
      buffer += chunk.toString();
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        // each chunk of json should begin with 'data:'
        if (line && line.startsWith('data:')) {
          const json = line.slice(5).trim();
          try {
            const parsedJson = JSON.parse(json);
            const convertedJson = convertKeysToCamelCase(parsedJson);
            yield convertedJson as Item;
          } catch (err) {
            console.debug(`Skipping malformed JSON:${line}`);
            continue;
          }
        }
      }
    }
    if (buffer.trim()) {
      try {
        const parsedJson = JSON.parse(buffer);
        const convertedJson = convertKeysToCamelCase(parsedJson);
        yield convertedJson as Item;
      } catch (err) {
        console.debug(`Skipping malformed JSON:${buffer}`);
      }
    }
  }
}
