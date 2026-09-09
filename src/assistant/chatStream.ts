import { convertKeysToCamelCase } from '../utils/convertKeys';

/**
 * An async iterable of assistant response chunks.
 *
 * Obtain it from {@link Assistant.chatStream} or {@link Assistant.chatCompletionStream};
 * do not construct it directly. Unlike a complete chat response, it yields updates as they arrive.
 *
 * @typeParam Item - The response chunk yielded during iteration.
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistant = pc.assistant({ name: 'support-guide' });
 * const stream = await assistant.chatStream({ messages: ['How do I return an order?'] });
 * for await (const chunk of stream) console.log(chunk);
 * ```
 */
export class ChatStream<Item> implements AsyncIterable<Item> {
  private stream: AsyncIterable<Uint8Array | string>;

  /** @internal */
  constructor(stream: AsyncIterable<Uint8Array | string>) {
    this.stream = stream;
  }

  /**
   * Iterates over response chunks as they arrive.
   *
   * @returns An iterator over the response chunks.
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const stream = await assistant.chatStream({ messages: ['How do I return an order?'] });
   * for await (const chunk of stream) console.log(chunk);
   * ```
   */
  async *[Symbol.asyncIterator](): AsyncIterator<Item> {
    let buffer = '';
    const decoder = new TextDecoder();
    for await (const chunk of this.stream) {
      buffer +=
        typeof chunk === 'string'
          ? chunk
          : decoder.decode(chunk, { stream: true });
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
          } catch {
            console.debug(`Skipping malformed JSON:${line}`);
            continue;
          }
        }
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      try {
        const parsedJson = JSON.parse(buffer);
        const convertedJson = convertKeysToCamelCase(parsedJson);
        yield convertedJson as Item;
      } catch {
        console.debug(`Skipping malformed JSON:${buffer}`);
      }
    }
  }
}
