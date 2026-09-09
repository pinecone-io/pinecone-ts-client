# Pod Indexes

The 2026-07 API supports managing existing pod-based indexes, but does not support creating new pod deployments or creating an index from a collection. Use an existing pod index for the operations below. For new indexes, see [Serverless Indexes](./serverless-indexes.md).

## Describe an existing pod index

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const indexModel = await pc.indexes.describe('existing-pod-index');
console.log(indexModel.deployment);
console.log(indexModel.status);
```

The response exposes deployment details under `deployment`. See [Understanding pod-based indexes](https://docs.pinecone.io/guides/indexes/pods/understanding-pod-based-indexes) for the concepts behind those settings.

## Scale an existing pod index

Use `indexes.configure` with a deployment patch to change replicas or pod type. Changes are asynchronous; inspect the returned status or call `indexes.describe` to check readiness.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
await pc.indexes.configure('existing-pod-index', {
  deployment: { replicas: 4, podType: 'p1.x2' },
});
```

See [Scaling pod-based indexes](https://docs.pinecone.io/guides/indexes/pods/scale-pod-based-indexes) for scaling concepts. Creation-time metadata settings cannot be recreated through a new pod-index request on this API version.

## Collections and other operations

You can still create and manage [collections](./collections.md) from existing pod indexes. The 2026-07 API does not offer collection-to-index restoration. See [common operations](./shared-operations.md) for configuring tags and deletion protection, listing, describing, and deleting existing indexes.
