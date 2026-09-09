# v9 Migration Guide

This guide covers breaking changes introduced in v9.x when upgrading from v8.x.

## Node.js 22 is now the minimum runtime

`engines.node` moved from `>=20.0.0` to `>=22.0.0`. Node 20 reached [end-of-life](https://github.com/nodejs/Release#release-schedule) on 2026-04-30 and no longer receives security patches.

Installing v9 on Node 20 or 21 produces an `EBADENGINE` warning, and fails outright if your project or CI sets npm's `engine-strict`:

```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@pinecone-database/pinecone@9.0.0',
npm warn EBADENGINE   required: { node: '>=22.0.0' },
npm warn EBADENGINE   current: { node: 'v20.19.0', npm: '10.8.2' }
npm warn EBADENGINE }
```

Upgrade your runtime to Node 22 (Maintenance LTS) or Node 24 (Active LTS); both are exercised in CI. If you cannot move off Node 20 yet, stay on v8.x.

The published JavaScript itself does not use any Node 22-only API, so v9 may still run on Node 20 in practice — but that combination is untested and unsupported, and nothing keeps it working in later releases.

## Flat control-plane methods remain available

The v8 flat control-plane methods, including `describeIndex`, `listIndexes`,
`configureIndex`, the collection and backup methods, restore-job methods, and
assistant methods, remain available as deprecated delegates to the resource APIs.
Editors show their replacements; there is no scheduled removal in v9.x.

For example, `pc.describeIndex('my-index')` delegates to
`pc.indexes.describe('my-index')`, preserving the response, errors, and index-host
cache updates. New code should use the resource APIs.

The legacy methods retain identifiers inside their options objects where needed:

| Legacy call                                          | Resource call                                |
| ---------------------------------------------------- | -------------------------------------------- |
| `pc.configureIndex({ name, ...options })`            | `pc.indexes.configure(name, options)`        |
| `pc.createBackup({ indexName, ...options })`         | `pc.backups.create(indexName, options)`      |
| `pc.createIndexFromBackup({ backupId, ...options })` | `pc.backups.createIndex(backupId, options)`  |
| `pc.listBackups({ indexName, ...options })`          | `pc.backups.listByIndex(indexName, options)` |
| `pc.listBackups()`                                   | `pc.backups.list()`                          |

For `listBackups`, omitting `indexName` lists project backups; `includeDeleted`
applies only when listing backups for an index.

These delegates preserve the flat method names and identifier placement. Other
v9 request and response schema changes still apply; for example, restoring
`createIndex` does not translate the v8 `dimension` option to the v9 schema.

## Document operations moved under `index.documents`

The six document methods on `Index` are now grouped behind a `documents`
accessor, matching the way the control plane groups index, collection, and
backup operations, and the way the Python client exposes the same operations.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const index = pc.index('my-schema-index').namespace('my-namespace');
await index.documents.upsert({
  documents: [{ _id: 'doc-1', chunk_text: 'Hello world' }],
});
```

The accessor is scoped to the same namespace as the `Index` it hangs off, so
`pc.index('my-index').namespace('ns-1').documents.upsert(...)` writes to `ns-1`.

The flat names were added during the v9 pre-release cycle and never shipped in
v8, so this affects only code already written against a v9 pre-release. They
remain available as deprecated delegates with unchanged arguments, responses,
and errors. Editors show their replacements; there is no scheduled removal in
v9.x.

Validation errors raised by either shape still name the flat method, for
example ``You must pass a non-empty `documents` array to upsertDocuments.``

| Flat method (deprecated)         | Accessor call                     |
| -------------------------------- | --------------------------------- |
| `index.upsertDocuments(options)` | `index.documents.upsert(options)` |
| `index.searchDocuments(options)` | `index.documents.search(options)` |
| `index.fetchDocuments(options)`  | `index.documents.fetch(options)`  |
| `index.updateDocuments(options)` | `index.documents.update(options)` |
| `index.listDocuments(options?)`  | `index.documents.list(options?)`  |
| `index.deleteDocuments(options)` | `index.documents.delete(options)` |

## `additionalHeaders` can now pin the API version

Every request this SDK sends carries `X-Pinecone-Api-Version: 2026-07`. To talk to an
older version of the API, pass the header through `additionalHeaders`:

```typescript
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  additionalHeaders: { 'X-Pinecone-Api-Version': '2026-01' },
});
```

In v8.x that entry was accepted and then discarded: each generated operation re-sent the
SDK's own version as a per-call header, and per-call headers won. Requests went out on the
SDK's version with no error and no warning. In v9, `additionalHeaders` is applied last, so
an entry keyed exactly `X-Pinecone-Api-Version` replaces the SDK's value on every request
that client makes, control plane and data plane alike, including clients handed back by
`pc.index(...)` and `pc.Index(...)`.

Matching is case-sensitive, so `x-pinecone-api-version` is sent alongside the SDK's header
rather than replacing it. The same last-write-wins rule now applies to every header the SDK
sets, including `Api-Key` and `User-Agent`.

Two limits are worth knowing before you pin. The SDK does not validate the value — the API
decides which versions it still serves and rejects the rest. And v9's request and response
models are generated from the 2026-07 schemas, so a pinned client can send and receive
shapes those models do not describe. Keep a pinned client scoped to the calls that need the
older version rather than using it as a general downgrade.
