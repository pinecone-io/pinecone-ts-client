# Working with Documents

Use documents to store searchable text, vector fields, and filterable metadata together in a serverless index.

Document operations use `_id` and ordinary top-level fields. For example, `category` is a document field, not a property inside a `metadata` object. Use `index.documents` for named searchable text or vector fields. Indexes with reserved `_values` or `_sparse_values` fields use the [vector API](./working-with-vectors.md).

## Create an index and target a namespace

Declare the fields you want to search in the index schema. A string field with `fullTextSearch: {}` supports full-text search without generating embeddings.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

// Reads PINECONE_API_KEY from the environment.
const pc = new Pinecone();

const model = await pc.indexes.create({
  name: 'document-search',
  deployment: {
    deploymentType: 'managed',
    cloud: 'aws',
    region: 'us-west-2',
  },
  schema: {
    fields: {
      title: { type: 'string', fullTextSearch: {} },
      body: { type: 'string', fullTextSearch: {} },
    },
  },
  waitUntilReady: true,
  timeout: 180_000,
});

const index = pc.index({ host: model.host, namespace: 'articles' });
```

The text and document management examples below use this `index` client. The vector search section creates a separate index. Targeting by host avoids a host lookup on the first data operation. You can also target an existing index by name with `pc.index({ name: 'document-search', namespace: 'articles' })` or change namespaces with `index.namespace('another-namespace')`. Every document operation is scoped to the selected namespace; omitting the namespace selects `__default__`.

See [Serverless Indexes](../index-management/serverless-indexes.md) for index configuration and [Namespaces](./namespaces.md) for namespace management.

## Upsert documents

Each document needs a unique `_id` within its namespace and at least one field declared in the schema, plus any schema fields marked required. Fields outside the schema are stored as filterable metadata. A document containing only `_id` and metadata is rejected.

```typescript
const result = await index.documents.upsert({
  documents: [
    {
      _id: 'article-1',
      title: 'Growing apples',
      body: 'Plant apple trees in a sunny orchard with well-drained soil.',
      category: 'gardening',
      draft: false,
    },
    {
      _id: 'article-2',
      title: 'Growing pears',
      body: 'Pear trees thrive in an orchard with plenty of sunlight.',
      category: 'gardening',
      draft: true,
    },
  ],
});

console.log(result.upsertedCount);
```

Use upsert to write documents and `index.documents.update` for partial changes. Keep requests within the document API's 2 MB document and request limits; each full-text-search field value is limited to 100 KB and 10,000 tokens.

Writes become visible to reads and search asynchronously. `waitUntilReady` waits for index creation, not for later writes to become searchable. If your workflow needs to search immediately after a write, poll the intended search with a bounded timeout until the expected document appears. A successful fetch alone does not establish search readiness.

## Search text and filter results

Use `text` scoring for BM25 text similarity. Specify one or more searchable fields and a non-empty query, then choose `topK` and the fields to return.

```typescript
const results = await index.documents.search({
  scoreBy: [
    { type: 'text', fields: ['title', 'body'], query: 'apple orchard' },
  ],
  topK: 5,
  filter: { category: { $eq: 'gardening' } },
  includeFields: ['title', 'body', 'category'],
});

for (const match of results.matches) {
  console.log(match._id, match._score, match.title, match.body);
}
```

Filters restrict the candidate documents; scoring ranks them. Filter on top-level document fields using expressions such as `{ category: { $eq: 'gardening' } }`. See [Metadata Filtering](./metadata-filtering.md) for comparison and logical operators.

Search always returns `_id` and `_score`. Omitting `includeFields`, or passing an empty array, returns no additional fields. Use `includeFields: ['*']` to return every document field.

### Query-string scoring

Use `query_string` when you want Lucene query-string syntax. Field qualifiers belong in the query itself; this scoring type must not specify `field` or `fields`.

```typescript
const results = await index.documents.search({
  scoreBy: [{ type: 'query_string', query: 'body:orchard' }],
  topK: 5,
  includeFields: ['title', 'body'],
});

console.log(results.matches);
```

An unqualified query, such as `query: 'orchard'`, searches all text-searchable fields. Both `text` and `query_string` require a query that is non-empty after trimming whitespace. You may combine multiple scoring clauses only when all are `text` or `query_string`.

## Fetch documents

Fetch by ID when you know which documents you need. The response's `documents` property is a map keyed by `_id`.

```typescript
const result = await index.documents.fetch({
  ids: ['article-1', 'article-2'],
  includeFields: ['title', 'category'],
});

console.log(result.documents['article-1']);
```

Fetch returns all fields when `includeFields` is omitted or empty; `['*']` also returns every field. A projection returns `_id` alongside the requested fields. These defaults differ from search, which returns only `_id` and `_score` unless you request fields.

To fetch by metadata, supply a non-empty `filter` instead of `ids`. Follow `pagination.next` to retrieve subsequent pages, keeping the filter and projection consistent:

```typescript
let paginationToken: string | undefined;

do {
  const page = await index.documents.fetch({
    filter: { category: { $eq: 'gardening' } },
    includeFields: ['title', 'category'],
    limit: 100,
    paginationToken,
  });

  for (const document of Object.values(page.documents)) {
    console.log(document._id, document.title);
  }
  paginationToken = page.pagination?.next;
} while (paginationToken);
```

`ids` and `filter` are mutually exclusive. Pagination tokens are valid only for filtered fetches; `limit` controls filtered page size.

## List document IDs

`index.documents.list` returns IDs in sorted order, with optional prefix filtering and pagination. Fetch the listed IDs when you also need their fields.

```typescript
let paginationToken: string | undefined;

do {
  const page = await index.documents.list({
    prefix: 'article-',
    limit: 100,
    paginationToken,
  });

  console.log(page.documents.map((document) => document._id));
  paginationToken = page.pagination?.next;
} while (paginationToken);
```

## Update document fields

For updates by ID, pass partial documents. Ordinary fields set new values; `_remove_fields` removes named fields.

```typescript
await index.documents.update({
  documents: [
    {
      _id: 'article-2',
      title: 'Growing pears in your orchard',
      _remove_fields: ['draft'],
    },
  ],
});
```

For a filtered update, use top-level `setFields` and/or `removeFields` instead of `documents`:

```typescript
const result = await index.documents.update({
  filter: { category: { $eq: 'gardening' } },
  setFields: { reviewed: true },
  removeFields: ['draft'],
});

console.log(result.matchedRecords);
```

`matchedRecords` is the count matching the filter when the update was accepted. The patch applies asynchronously; the count does not guarantee how many documents ultimately receive the changes. Updates by ID do not return this count. Search-only text-match operators, such as `$match_phrase`, cannot be used in update or delete filters.

## Delete documents

Choose exactly one of `ids`, `filter`, or `deleteAll` per request:

```typescript
await index.documents.delete({ ids: ['article-1'] });
```

```typescript
await index.documents.delete({ filter: { draft: { $eq: true } } });
```

```typescript
// Deletes every document in the namespace selected by this client.
await index.documents.delete({ deleteAll: true });
```

Deletion is asynchronous. Other namespaces are unaffected, including documents with the same IDs.

## Search vector fields in documents

A document schema can also declare `dense_vector` and `sparse_vector` fields alongside searchable text. Create a separate index for this example; vector fields cannot be added to the text-only index created above. These small vectors illustrate the request shape. In your application, supply vectors generated by your embedding model, with the dense vector length matching the schema dimension.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone();
const model = await pc.indexes.create({
  name: 'document-vector-search',
  schema: {
    fields: {
      body: { type: 'string', fullTextSearch: {} },
      embedding: { type: 'dense_vector', dimension: 3, metric: 'cosine' },
      terms: { type: 'sparse_vector' },
    },
  },
  deployment: { deploymentType: 'managed', cloud: 'aws', region: 'us-west-2' },
  waitUntilReady: true,
  timeout: 180_000,
});
const vectorDocumentIndex = pc.index({
  host: model.host,
  namespace: 'articles',
});
await vectorDocumentIndex.documents.upsert({
  documents: [
    {
      _id: 'article-1',
      title: 'Growing apples',
      body: 'Plant apple trees in a sunny orchard.',
      embedding: [0.1, 0.2, 0.3],
      terms: { indices: [1, 8], values: [0.5, 0.9] },
    },
  ],
});
```

Once the document becomes searchable, search either vector field:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone();
const vectorDocumentIndex = pc.index({
  name: 'document-vector-search',
  namespace: 'articles',
});
const results = await vectorDocumentIndex.documents.search({
  scoreBy: [
    { type: 'dense_vector', fields: ['embedding'], values: [0.1, 0.2, 0.3] },
  ],
  topK: 5,
  includeFields: ['title', 'body'],
});
```

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone();
const vectorDocumentIndex = pc.index({
  name: 'document-vector-search',
  namespace: 'articles',
});
const results = await vectorDocumentIndex.documents.search({
  scoreBy: [
    {
      type: 'sparse_vector',
      fields: ['terms'],
      sparseValues: { indices: [1, 8], values: [0.5, 0.9] },
    },
  ],
  topK: 5,
  includeFields: ['title', 'body'],
});
```

Each vector scoring clause targets exactly one field and must be the only clause in `scoreBy`. The API does not combine vector and text clauses, or dense and sparse clauses, in one search request. Document search accepts query vector values; it has no query-by-ID form. Prefer `fields` over the deprecated singular `field` option.
