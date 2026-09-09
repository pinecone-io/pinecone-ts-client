# Namespaces

Namespaces allow you to partition documents or vectors within an index. This is useful for organizing different types of data, implementing multitenancy, or isolating test data from production data.

For more information, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).

## Working with namespaces

By default, all data operations take place inside the default namespace of `'__default__'`. If you are working with other non-default namespaces, you can specify the namespace when targeting an index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.indexes.describe('test-index');
const index = pc.index({ host: indexModel.host, namespace: 'ns1' });

// On a document index, fetch documents from the 'ns1' namespace
await index.documents.fetch({ ids: ['1'] });
```

Document operations use the namespace set on the index client. You can also target another namespace with `index.namespace('ns2')`. See [Working with Documents](./working-with-documents.md) for a complete document workflow.

Vector operations also accept a namespace on individual requests, overriding the namespace set on the `Index` class:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.indexes.describe('test-index');
const index = pc.index({ host: indexModel.host });

// Query in a specific namespace
await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  namespace: 'ns1',
});
```

## List namespaces

The following example lists one page of namespaces in an index. Pass `pagination.next` as `paginationToken` to retrieve subsequent pages:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.indexes.describe('test-index');
const index = pc.index({ host: indexModel.host });

const namespaces = await index.listNamespaces();
console.log(namespaces);
// {
//   namespaces: [{ name: 'ns1', recordCount: '1000' }]
// }
```

## Describe a namespace

The following example describes a specific namespace:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.indexes.describe('test-index');
const index = pc.index({ host: indexModel.host });

const namespace = await index.describeNamespace('ns1');
console.log(namespace);
// {
//   recordCount: '1000',
//   name: 'ns1'
// }
```

## Delete a namespace

The following example deletes a namespace and all its data:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

const indexModel = await pc.indexes.describe('test-index');
const index = pc.index({ host: indexModel.host });

await index.deleteNamespace('ns1');
```

> **Warning:** Deleting a namespace is a permanent operation and will delete all documents or vectors within that namespace.

## Namespace best practices

1. **Multitenancy**: Use namespaces to isolate data for different purposes
2. **Environment separation**: Keep dev, staging, and production data separate
3. **Data organization**: Group related documents or vectors together (e.g., by user or time period)
4. **Prefix naming**: Consider using ID prefixes in combination with namespaces for hierarchical organization

For more information on implementing multitenancy, see [Implement multitenancy](https://docs.pinecone.io/guides/index-data/implement-multitenancy).
