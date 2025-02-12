import { Readable } from 'stream';
import { convertKeysToCamelCase } from './convertKeys';

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
            console.warn(`Skipping malformed JSON:${line}`);
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
        console.warn(`Skipping malformed JSON:${buffer}`);
      }
    }
  }
}
