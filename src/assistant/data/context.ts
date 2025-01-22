import { ContextAssistantRequest } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';

/**
 * The `Context` interface describes the query and optional filter to retrieve context snippets from an Assistant.
 */
export interface Context {
  /**
   * The query to retrieve context snippets for.
   */
  query: string;
  /**
   * Optional filter to apply to the context snippets.
   */
  filter?: Record<string, string>;
}

/**
 * Retrieves [the context snippets](https://docs.pinecone.io/guides/assistant/understanding-context-snippets) used
 * by an Assistant during the retrieval process.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistantName = 'test1';
 * const assistant = pc.Assistant(assistantName);
 * const response = await assistant.context({query: "What is the capital of France?"});
 * console.log(response);
 * // {
 * //  snippets: [
 * //    {
 * //      type: 'text',
 * //      content: 'The capital of France is Paris.',
 * //      score: 0.9978925,
 * //      reference: [Object]
 * //    },
 * //  ],
 * //  usage: { promptTokens: 527, completionTokens: 0, totalTokens: 527 }
 * // }
 * ```
 *
 * @param assistantName - The name of the Assistant to retrieve the context snippets from.
 * @param api - The Pinecone API object.
 * @throws An error if a query is not provided.
 * @returns A promise that resolves to a {@link Context} object containing the context snippets.
 */
export const context = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider
) => {
  return async (options: Context) => {
    if (!options.query) {
      throw new Error('Must provide a query');
    }
    const api = await apiProvider.provideData();
    const request = {
      assistantName: assistantName,
      contextRequest: {
        query: options.query,
        filter: options.filter,
      },
    } as ContextAssistantRequest;
    return api.contextAssistant(request);
  };
};
