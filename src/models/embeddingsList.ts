import {
  Embedding,
  EmbeddingsList as OpenAPIEmbeddingsList,
  EmbeddingsListUsage,
} from '../pinecone-generated-ts-fetch/control';

/* This class wraps the OpenAPI-generated EmbeddingsList interface so that an EmbeddingsList object acts like an Array.
This class also customizes the output of an EmbeddingsList to improve UX.

```typescript
const embeddingsList = new EmbeddingsList('someEmbeddingModel', [embedding1, embedding2], usage);
console.log(embeddingsList);
>>> EmbeddingsList({
  "model": "someEmbeddingModel",
  "data": [
    "values": [0.1, 0.2, ..., 0.5, 0.6],
    "values": [0.6, 0.7, ..., 1.0, 1.1]
  ],
  "usage": {"totalTokens": 2}
})
```
*/
export class EmbeddingsList
  extends Array<Embedding>
  implements OpenAPIEmbeddingsList
{
  model?: string;
  data: Array<Embedding>;
  usage?: EmbeddingsListUsage;

  constructor(
    model?: string,
    data: Array<Embedding> = [],
    usage?: EmbeddingsListUsage
  ) {
    super(...data);
    // Set the prototype explicitly to ensure the instance is of type EmbeddingsList
    Object.setPrototypeOf(this, EmbeddingsList.prototype);
    this.model = model;
    this.data = data;
    this.usage = usage;
  }

  /* Customize format of output. */
  public toString(): string {
    const truncatedData = this.truncateDataForDisplay();
    const dataObject = truncatedData
      .map((embedding) => {
        if (typeof embedding === 'string') {
          return `    ${embedding}`;
        }
        let embeddingObject = JSON.stringify(embedding, (key, value) =>
          key === 'values' && Array.isArray(value) ? value : value
        );
        embeddingObject = embeddingObject.replace(/:/g, ': ');

        // Format the embedding itself
        const valuesArray =
          embeddingObject.match(/"values": \[(.*?)\]/)?.[1] || '';
        const formattedEmbedding = valuesArray
          .split(',')
          .join(', ')
          .replace(/"/g, '');

        // Replace the right side of the colon after "values: "
        embeddingObject = embeddingObject.replace(
          /("values": )\[(.*?)\]/,
          `$1[${formattedEmbedding}]`
        );

        return `    ${embeddingObject}`;
      })
      .join(',\n');

    const usageObject = JSON.stringify(this.usage).replace(/:/g, ': ');
    return (
      `EmbeddingsList({\n` +
      `  "model": "${this.model}",\n` +
      `  "data": [\n` +
      `${dataObject}\n` +
      `   ],\n` +
      `  "usage": ${usageObject}\n` +
      `  })`
    );
  }

  public toJSON(): any {
    return {
      model: this.model,
      data: this.truncateDataForDisplay(),
      usage: this.usage,
    };
  }

  public get(index: number): Embedding {
    return this[index];
  }

  public indexOf(element: Embedding): number {
    return this.data ? this.data.indexOf(element) : -1;
  }

  /* Truncate the content of an embedding in the output when there are >5 numbers. */
  truncateValuesForDisplay(values: number[]): any[] {
    if (!values || values.length <= 4) {
      return values ? values : [];
    }
    return [...values.slice(0, 2), '...', ...values.slice(-2)];
  }

  /* Truncate the number of embedding objects in the output when there are more >6 embeddings. */
  truncateDataForDisplay(): Array<any> {
    if (!this.data) return [];
    if (this.data.length <= 5) {
      return this.data.map((embedding) => ({
        values: embedding.values
          ? this.truncateValuesForDisplay(embedding.values)
          : [],
      }));
    }
    return [
      ...this.data.slice(0, 2).map((embedding) => ({
        values: embedding.values
          ? this.truncateValuesForDisplay(embedding.values)
          : [],
      })),
      `   ... (${this.data.length - 4} more embeddings) ...`,
      ...this.data.slice(-2).map((embedding) => ({
        values: embedding.values
          ? this.truncateValuesForDisplay(embedding.values)
          : [],
      })),
    ];
  }
}
