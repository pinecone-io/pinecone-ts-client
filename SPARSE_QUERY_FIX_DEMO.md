# Sparse-Only Query Support - Fix Demonstration

## Issue Summary
GitHub Issue #337: Users needed to query Pinecone indexes using only `sparseVector` for cascading retrieval, but the TypeScript SDK required the `vector` parameter.

## Before the Fix

Users had to use `@ts-ignore` to bypass type checking:

```typescript
// @ts-ignore - TypeScript error: vector is required
await index.query({
  sparseVector: { indices: [0, 1, 2], values: [0.5, 0.3, 0.2] },
  topK: 10,
});
```

Or pass an empty vector array (which would fail at runtime):

```typescript
// This would pass TypeScript but fail at runtime with:
// PineconeArgumentError: You must enter an array of RecordValues
await index.query({
  vector: [], // ❌ Runtime error
  sparseVector: { indices: [0, 1, 2], values: [0.5, 0.3, 0.2] },
  topK: 10,
});
```

## After the Fix

### Sparse-Only Queries (NEW)
```typescript
// ✅ No TypeScript error, works at runtime
await index.query({
  sparseVector: { indices: [0, 1, 2], values: [0.5, 0.3, 0.2] },
  topK: 10,
  includeMetadata: true,
});
```

### Dense-Only Queries (Still Supported)
```typescript
// ✅ Works as before
await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
});
```

### Hybrid Queries (Still Supported)
```typescript
// ✅ Works as before
await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  sparseVector: { indices: [0, 1], values: [0.5, 0.3] },
  topK: 10,
});
```

### Query by ID (Still Supported)
```typescript
// ✅ Works as before
await index.query({
  id: 'record-123',
  topK: 10,
});
```

## Implementation Details

### New Type: `QueryBySparseVector`
```typescript
export type QueryBySparseVector = QueryShared & {
  sparseVector: RecordSparseValues;
};
```

### Updated Union Type
```typescript
export type QueryOptions =
  | QueryByRecordId
  | QueryByVectorValues
  | QueryBySparseVector;
```

### Validation Updates
- Ensures at least one of `id`, `vector`, or `sparseVector` is provided
- Allows empty `vector` when valid `sparseVector` is present
- Provides clear error messages when no valid query method is supplied

## Test Coverage

New tests added for:
- ✅ Querying with only `sparseVector` (no vector)
- ✅ Querying with `sparseVector` and metadata flags
- ✅ Error when neither `id`, `vector`, nor `sparseVector` is provided
- ✅ Error when empty `vector` without `sparseVector`
- ✅ Querying with both `vector` and `sparseVector` (hybrid)

All 272 unit tests pass. ✅

## Use Case: Cascading Retrieval

This fix enables the recommended cascading retrieval pattern:

```typescript
// Step 1: Query sparse index
const sparseResults = await sparseIndex.query({
  sparseVector: { indices: [0, 1, 2], values: [0.5, 0.3, 0.2] },
  topK: 100,
});

// Step 2: Query dense index
const denseResults = await denseIndex.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 100,
});

// Step 3: Combine and rerank results
const combinedResults = rerank([...sparseResults, ...denseResults]);
```

## Backward Compatibility

✅ All existing query patterns continue to work
✅ No breaking changes to the API
✅ Type exports maintain existing structure
