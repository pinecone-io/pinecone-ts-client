# v8 Migration Guide

This guide covers breaking changes introduced in v8.x when upgrading from v7.x.

## Assistant file operations

The 2026-04 API made all file mutation operations asynchronous. `uploadFile` and `deleteFile` now return an `OperationModel` that tracks the async operation, rather than resolving once the file is ready.

### `uploadFile` return type changed

`uploadFile` previously returned an `AssistantFileModel` describing the created file. It now returns an `OperationModel` describing the in-progress upload operation.

**Before: ≤ 7.x**

```typescript
const file = await assistant.uploadFile({ path: 'report.pdf' });
console.log(file.id);     // file ID, ready to use
console.log(file.status); // 'Processing' | 'Available' | 'Failed'
```

**After: ≥ 8.0**

```typescript
const operation = await assistant.uploadFile({ path: 'report.pdf' });
console.log(operation.id);          // operation ID — use this to poll
console.log(operation.fileId);      // the file ID being created
console.log(operation.status);      // 'Processing' | 'Completed' | 'Failed'

// Poll until the file is ready
let op = operation;
while (op.status === 'Processing') {
  await new Promise((r) => setTimeout(r, 2000));
  op = await assistant.describeOperation({ operationId: operation.id });
}
```

### `deleteFile` signature and return type changed

`deleteFile` previously accepted `{ fileId: string }` and returned `void`. It now accepts a bare `fileId: string` and returns an `OperationModel`.

**Before: ≤ 7.x**

```typescript
await assistant.deleteFile({ fileId: 'abc123' });
// void — deletion was synchronous
```

**After: ≥ 8.0**

```typescript
const operation = await assistant.deleteFile('abc123');
// Returns an OperationModel — deletion is asynchronous
console.log(operation.status); // 'Processing' | 'Completed' | 'Failed'

// Optionally poll to confirm completion
const completed = await assistant.describeOperation({
  operationId: operation.id,
});
```

## New assistant APIs

### `upsertFile`

Create or replace a file at a caller-supplied ID. Unlike `uploadFile`, the ID is stable across calls and no metadata is accepted.

```typescript
const operation = await assistant.upsertFile({
  assistantFileId: 'my-spec',
  path: './openapi.yaml',
});
```

### `describeOperation`

Fetch the current status of any async file operation by its ID.

```typescript
const op = await assistant.describeOperation({ operationId: operation.id });
console.log(op.status);          // 'Processing' | 'Completed' | 'Failed'
console.log(op.percentComplete); // 0–100
```

### `listOperations`

List recent async operations, optionally filtered by type or status. Operations are retained for 30 days.

```typescript
const ops = await assistant.listOperations({
  status: 'Completed',
  limit: 20,
});
```
