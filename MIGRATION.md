# Index options on the 2026-07 API

Existing `pc.createIndex()` and `pc.configureIndex({ name, ...options })` entry points remain available. The `pc.indexes.create()` and `pc.indexes.configure(name, options)` methods accept the same legacy vector configuration.

```typescript
await pc.createIndex({
  name: 'vectors',
  dimension: 1536,
  metric: 'cosine',
  spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
});
```

This creates a reserved `_values` dense vector field and a managed deployment. Existing vector upsert, query, fetch, and delete calls continue to use the vectors API. Sparse indexes use `vectorType: 'sparse'`, omit `dimension`, and accept only the `dotproduct` metric. Dense indexes default to `cosine`.

New schema-based indexes use `schema` and `deployment`. Do not combine those options with `dimension`, `metric`, `vectorType`, or `spec` in the same call. Custom schema fields select the documents API.

Read capacity moves from `spec.serverless.readCapacity` or `spec.byoc.readCapacity` to the top-level request. Both the legacy `{ nodeType, manual: { replicas, shards } }` shape and the new `{ mode: 'Dedicated', dedicated: { nodeType, scaling: 'Manual', manual: { replicas, shards } } }` shape are accepted on legacy calls. An explicit top-level value overrides the spec's capacity. BYOC requires dedicated capacity.

Existing pod indexes can still be configured with `podReplicas` and `podType`; these translate to `deployment.replicas` and `deployment.podType` without describing the index first. The 2026-07 API does not create new pod indexes.

Legacy metadata schemas cannot be translated to searchable document schemas. Metadata is indexed automatically. To restore a backup use `pc.backups.createIndex(backupId, { name })`. To create an integrated embedding index use `pc.indexes.createForModel({ name, model, field, deployment })`; converting an existing index through `configure({ embed })` is no longer supported.
