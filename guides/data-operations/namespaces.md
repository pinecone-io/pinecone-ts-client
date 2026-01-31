# Namespaces

Namespaces allow you to partition vectors within an index. This is useful for organizing different types of data, implementing multitenancy, or isolating test data from production data.

For more information, see [Use namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).

## Working with namespaces

By default, all data operations take place inside the default namespace of `''`. If you are working with other non-default namespaces, you can specify the namespace when targeting an index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'test-index', namespace: 'ns1' });

// Now all operations will use the 'ns1' namespace
await index.fetch({ ids: ['1'] });
```

Alternatively, you can specify the namespace for individual operations:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'test-index' });

// Query in a specific namespace
await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  namespace: 'ns1',
});
```

## List namespaces

The following example lists all namespaces in an index:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'test-index' });

const namespaces = await index.listNamespaces();
console.log(namespaces);
// {
//   namespaces: ['', 'ns1', 'ns2', 'ns3']
// }
```

## Describe a namespace

The following example describes a specific namespace:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'test-index' });

const namespace = await index.describeNamespace('ns1');
console.log(namespace);
// {
//   recordCount: 1000,
//   namespaceId: 'ns1'
// }
```

## Delete a namespace

The following example deletes a namespace and all its vectors:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'test-index' });

await index.deleteNamespace('ns1');
```

> **Warning:** Deleting a namespace is a permanent operation and will delete all vectors within that namespace.

## Namespace best practices

1. **Multitenancy**: Use namespaces to isolate data for different customers or tenants
2. **Environment separation**: Keep dev, staging, and production data separate
3. **Data organization**: Group related vectors together (e.g., by document, user, or time period)
4. **Prefix naming**: Consider using ID prefixes in combination with namespaces for hierarchical organization
5. **Query performance**: Querying within a namespace is faster than querying across the entire index

For more information on implementing multitenancy, see [Implement multitenancy](https://docs.pinecone.io/guides/index-data/implement-multitenancy).
