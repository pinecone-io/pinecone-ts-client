# v9 Migration Guide

This guide covers breaking changes introduced in v9.x when upgrading from v8.x.
v9 targets the 2026-07 API version. The control plane uses resource namespaces,
new index definitions use a typed `schema`, and pod-based indexes can no longer
be created. Compatibility delegates and legacy request translation preserve
many v8 call sites; response shapes still require attention.

Vector and document operations are both supported, including for new indexes. Existing vector applications do not need to adopt `index.documents`. Start with the [runtime requirements](#nodejs-22-is-now-the-minimum-runtime), then review [index response properties](#index-responses-retain-derived-legacy-properties), [backup timestamps](#backup-timestamps-and-schema), and [imported types](#removed-and-renamed-exports) used by your application.

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

<a id="flat-control-plane-methods-remain-available"></a>

## The control plane moved under resource namespaces

Every flat `Pinecone` method that manages an index, collection, backup, restore
job, or assistant now lives on a resource client instead: `pc.createIndex`
becomes `pc.indexes.create`, `pc.createBackup` becomes `pc.backups.create`, and
so on.

The flat methods remain available as deprecated delegates. Both
`pc.createIndex` and `pc.indexes.create` accept supported legacy
`dimension`/`metric`/`spec` options and translate them to the 2026-07 request.
New code can use the resource clients; editors show the replacement on each
deprecated method, and there is no scheduled removal in v9.x.

| Legacy call (deprecated)                             | Resource call                                |
| ---------------------------------------------------- | -------------------------------------------- |
| `pc.createIndex(options)`                            | `pc.indexes.create(options)`                 |
| `pc.createIndexForModel(options)`                    | `pc.indexes.createForModel(options)`         |
| `pc.describeIndex(name)`                             | `pc.indexes.describe(name)`                  |
| `pc.listIndexes()`                                   | `pc.indexes.list()`                          |
| `pc.deleteIndex(name)`                               | `pc.indexes.delete(name)`                    |
| `pc.configureIndex({ name, ...options })`            | `pc.indexes.configure(name, options)`        |
| `pc.createCollection(options)`                       | `pc.collections.create(options)`             |
| `pc.listCollections()`                               | `pc.collections.list()`                      |
| `pc.describeCollection(name)`                        | `pc.collections.describe(name)`              |
| `pc.deleteCollection(name)`                          | `pc.collections.delete(name)`                |
| `pc.createBackup({ indexName, ...options })`         | `pc.backups.create(indexName, options)`      |
| `pc.listBackups({ indexName, ...options })`          | `pc.backups.listByIndex(indexName, options)` |
| `pc.listBackups()`                                   | `pc.backups.list()`                          |
| `pc.describeBackup(id)`                              | `pc.backups.describe(id)`                    |
| `pc.deleteBackup(id)`                                | `pc.backups.delete(id)`                      |
| `pc.createIndexFromBackup({ backupId, ...options })` | `pc.backups.createIndex(backupId, options)`  |
| `pc.describeRestoreJob(id)`                          | `pc.restoreJobs.describe(id)`                |
| `pc.listRestoreJobs(options)`                        | `pc.restoreJobs.list(options)`               |
| `pc.createAssistant(options)`                        | `pc.assistants.create(options)`              |
| `pc.describeAssistant(name)`                         | `pc.assistants.describe(name)`               |
| `pc.listAssistants()`                                | `pc.assistants.list()`                       |
| `pc.deleteAssistant(name)`                           | `pc.assistants.delete(name)`                 |
| `pc.updateAssistant(options)`                        | `pc.assistants.update(options)`              |
| `pc.evaluate(options)`                               | `pc.assistants.evaluate(options)`            |

For `listBackups`, omitting `indexName` lists project backups; `includeDeleted`
applies only when listing backups for an index.

For example, `pc.describeIndex('my-schema-index')` delegates to
`pc.indexes.describe('my-schema-index')`, preserving the response, errors, and
index-host cache updates:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

// Still works, but shows a deprecation notice in your editor:
const legacy = await pc.describeIndex('my-schema-index');

// Preferred:
const current = await pc.indexes.describe('my-schema-index');
```

Several entries change identifier placement rather than just adding a namespace:
`configureIndex` and `createBackup` carry their target name as a field inside
the v8 options object (`{ name, ... }` or `{ indexName, ... }`), and as a
separate leading argument on the resource call
(`configure(name, options)`, `create(indexName, options)`). The delegates
handle that identifier translation for you. Legacy index creation also translates
supported request fields, as described next. Response schema changes still apply.

## Index creation supports native and legacy options

`Indexes.create` and the deprecated `pc.createIndex` accept either native
`schema`/`deployment` options or legacy `dimension`/`metric`/`vectorType`/`spec`
options. Do not mix the two shapes. Legacy serverless and BYOC requests are
translated to reserved vector fields and the corresponding deployment.
Legacy pod creation, metadata schemas, and source-collection/source-backup
creation options are rejected with migration guidance.

Native options describe searchable fields through `schema`, with an optional
`deployment` selecting infrastructure. Use reserved `_values` or `_sparse_values`
fields for vector operations, or custom named fields for document operations.
Both use the same index creation API. Changing to an arbitrary named vector
field changes the data operations the index accepts; preserve reserved fields
when migrating an `index.upsert`/`index.query` workflow.

**Legacy request: still supported**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

await pc.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: { cloud: 'aws', region: 'us-east-1' },
  },
});
```

**Native request for the same vector workflow**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const indexModel = await pc.indexes.create({
  name: 'my-index',
  schema: {
    fields: {
      _values: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
    },
  },
  waitUntilReady: true,
});
```

`create` returns `IndexModel` when `suppressConflicts` is omitted or explicitly
`false`, including the example above. Passing `suppressConflicts: true` makes it
resolve to `undefined` instead of throwing when an index with that name already
exists. Calls with that option, or a boolean whose value is not statically
known, return `IndexModel | void`; narrow the result before reading properties.

How the legacy concepts map to the native schema:

- `dimension` and `metric` belong to a `dense_vector` field in `schema.fields`.
  A native `sparse_vector` field has no dimension or configurable metric; legacy
  sparse creation accepts only `dotproduct`.
- `vectorType` is implied by the field type instead of being a separate
  option: `dense_vector` or `sparse_vector` when you declare the schema
  yourself with `create`, or `semantic_text` when the server builds the field
  for you from `createForModel`'s `embed` parameters (`semantic_text` cannot
  be declared directly in `create`'s `schema.fields`; it only appears when you
  later describe the resulting index).
- `spec` becomes `deployment`. `{ serverless: { cloud, region } }` becomes
  `{ deploymentType: 'managed', cloud, region }`; `{ byoc: { environment } }`
  becomes `{ deploymentType: 'byoc', environment }`. There is no pod-based
  `deployment` for index creation — see below.
- `embed` (top-level integrated embedding) becomes a `semantic_text` schema
  field, built for you by `pc.indexes.createForModel`, which keeps the flat
  `cloud`/`region`/`embed` shape for that one case.

An index may declare at most one `dense_vector` and one `sparse_vector` field,
and must declare at least one field. Field types, dimensions, metrics, and
text-analysis settings are permanent — `schema` cannot be changed after
creation except through `pc.indexes.configure`'s narrower patch shape, which
can only update a `semantic_text` field's embedding parameters.

<a id="the-index-response-lost-its-flat-vector-fields"></a>

<a id="the-index-response-lost-its-flat-vector-fields"></a>

## Index responses retain derived legacy properties

`IndexModel` responses from `create`, `createForModel`, `describe`, `configure`,
and each entry of `list`'s `indexes` array expose deprecated `dimension`,
`metric`, `vectorType`, `spec`, and `embed` getters. The deprecated flat control
methods return the same decorated responses. The API's native data lives in
`schema`, `deployment`, and top-level `readCapacity`; use those fields for new
code and when persisting responses:

| v8 field     | v9 equivalent                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dimension`  | `schema.fields.<name>.dimension` on the `dense_vector` field                                                                                                                                      |
| `metric`     | `schema.fields.<name>.metric` on the `dense_vector` field                                                                                                                                         |
| `vectorType` | Map `dense_vector` to `'dense'` and `sparse_vector` to `'sparse'`, or use `deriveVectorType` to preserve legacy semantics. A `semantic_text` field alone does not determine a legacy vector type. |
| `spec`       | `deployment` — `{ deploymentType: 'managed' \| 'byoc' \| 'pod', ... }`                                                                                                                            |
| `embed`      | The `semantic_text` field in `schema.fields`, if the index has one                                                                                                                                |

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const indexModel = await pc.indexes.describe('my-schema-index');

for (const [name, field] of Object.entries(indexModel.schema.fields)) {
  if ('type' in field && field.type === 'dense_vector') {
    console.log(name, field.dimension, field.metric);
  }
}

if (indexModel.deployment.deploymentType === 'managed') {
  console.log(indexModel.deployment.cloud, indexModel.deployment.region);
}
```

The getters derive values only where the response supplies a supported legacy
equivalent. Sparse vector indexes retain `metric: 'dotproduct'`,
`vectorType: 'sparse'`, and an absent `dimension`. A full-text-only index has no
legacy vector dimension or metric: reading either throws
`PineconeIndexPropertyError`. Ambiguous schemas, initializing responses, and
unreported model settings can also cause property reads to throw. Optional
typing does not make a getter safe: `model.dimension ?? 0` can still throw.

`spec` projects the deployment into `serverless`, `byoc`, or `pod`. Its managed
and BYOC `readCapacity` is the API's reported response object, not a recreated
v8 capacity shape; reading that nested property throws if the API omitted it.
Legacy metadata configuration cannot be inferred from searchable fields, so
`spec.serverless.schema`, `spec.byoc.schema`, and `spec.pod.metadataConfig` are
not populated. `embed` derives settings from a single `semantic_text` field
and is absent otherwise.

For explicit handling without throwing compatibility getters, the exported
`deriveDimension`, `deriveMetric`, `deriveVectorType`, `deriveSpec`, and
`deriveEmbed` helpers return a `Derived<T>` result with an `outcome` of
`value`, `absent`, or `error`:

```typescript
import { deriveDimension } from '@pinecone-database/pinecone';
import type { IndexModelData } from '@pinecone-database/pinecone';

function reportDimension(model: IndexModelData) {
  const result = deriveDimension(model);
  if (result.outcome === 'value') return String(result.value);
  if (result.outcome === 'absent') return 'Not applicable';
  return `Unavailable: ${result.failure.reason}`;
}
```

`status`, `readCapacity`, and `deletionProtection` also changed shape — see
the `IndexModel` reference in the [API documentation](https://sdk.pinecone.io/typescript/interfaces/IndexModel.html) for the full type.

## Namespace counters are decimal strings

`NamespaceDescription.recordCount` and `sizeBytes` changed from optional
`number` to optional `string`. These represent 64-bit integers, which can
exceed JavaScript's safe integer range. The decoder passes the wire value
through; this declaration correction does not introduce a runtime conversion
from numbers to strings. Replace arithmetic on the old numeric declaration
with explicit conversion, and preserve `undefined` when the count is unknown.
Do not apply this change to every counter: `BackupModel` counts remain numbers.

```typescript
import type { NamespaceDescription } from '@pinecone-database/pinecone';

const namespace: NamespaceDescription = {
  recordCount: '9007199254740993',
  sizeBytes: '18014398509481986',
};
const records =
  namespace.recordCount === undefined
    ? undefined
    : BigInt(namespace.recordCount);
const bytes =
  namespace.sizeBytes === undefined ? undefined : BigInt(namespace.sizeBytes);
const bytesPerRecord =
  records !== undefined && records > 0n && bytes !== undefined
    ? bytes / records // BigInt division truncates the fractional part.
    : undefined;

function safeNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const integer = BigInt(value);
  if (integer < 0n || integer > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('Counter cannot be represented as a safe number');
  }
  return Number(integer);
}
const smallCount = safeNumber('42');
const unknownCount = safeNumber(undefined);
console.log(bytesPerRecord, smallCount, unknownCount);
```

Keep the original decimal strings in JSON storage: `JSON.stringify` cannot
serialize `bigint` values directly. Converting an already rounded number to
`BigInt` cannot recover its lost precision.

## Backup timestamps and schema

`BackupModel.createdAt` was an optional string in v8; the v9 decoder returns
an optional `Date`. Replace string operations with `toISOString()` for display
or persistence and `getTime()` for comparisons, guarding absence first.
`dimension` and `metric` were removed from the backup's top level; inspect the
optional `schema` and select the vector field your application uses. When
`schema` is absent, the backup response does not supply that information. Do
not guess a dimension or metric, or substitute the current source index's
schema for the backed-up schema.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();
const backup = await pc.backups.describe('backup-id');
const createdAtIso = backup.createdAt?.toISOString();
const createdBeforeToday =
  backup.createdAt === undefined
    ? undefined
    : backup.createdAt.getTime() < new Date().setUTCHours(0, 0, 0, 0);

for (const [name, field] of Object.entries(backup.schema?.fields ?? {})) {
  if ('type' in field && field.type === 'dense_vector') {
    console.log(name, field.dimension, field.metric);
  }
}
console.log(createdAtIso, createdBeforeToday);
```

JSON converts a `Date` to an ISO string; parsing JSON does not revive it. Use
an application storage contract and validate parsed data before reconstructing
a date. This example also accepts the string timestamp stored by v8; it does
not assert that a parsed object is a live `BackupModel`.

```typescript
type StoredBackup = { backupId: string; createdAt?: string };
const stored: StoredBackup = {
  backupId: 'backup-id',
  createdAt: '2026-09-09T00:00:00.000Z',
};
const parsed: unknown = JSON.parse(JSON.stringify(stored));
if (
  typeof parsed !== 'object' ||
  parsed === null ||
  !('backupId' in parsed) ||
  typeof parsed.backupId !== 'string'
) {
  throw new Error('Invalid stored backup');
}
const timestamp = 'createdAt' in parsed ? parsed.createdAt : undefined;
if (timestamp !== undefined && typeof timestamp !== 'string') {
  throw new Error('Invalid stored timestamp');
}
const createdAt = timestamp === undefined ? undefined : new Date(timestamp);
if (createdAt !== undefined && Number.isNaN(createdAt.getTime())) {
  throw new Error('Invalid stored date');
}
console.log(parsed.backupId, createdAt?.toISOString());
```

## Restore dates and nullable responses

`RestoreJobModel.createdAt` now has type `Date | null`. A wire `null` is
preserved as `null`, so replace unconditional date method calls with a guard.
`completedAt` now has type `Date | null | undefined`, but the current decoder
turns both a missing wire field and wire `null` into `undefined`. A present
non-null timestamp becomes a `Date`. The wider declaration does not promise
that the SDK will return `null` for an unfinished job. Use a nullish guard that
also works with explicitly nullable fixtures:

```typescript
import type { RestoreJobModel } from '@pinecone-database/pinecone';

function restoreTiming(job: RestoreJobModel) {
  return {
    started: job.createdAt?.toISOString(),
    finished: job.completedAt?.toISOString(),
    elapsedMs:
      job.createdAt != null && job.completedAt != null
        ? job.completedAt.getTime() - job.createdAt.getTime()
        : undefined,
  };
}
```

Other response declarations now admit `null`, including `IndexModel.tags`,
`BackupModel.tags`, `BackupList.pagination`, and
`ReadCapacityStatus.currentReplicas` / `currentShards`. Their current decoders
normalize missing or null wire fields to `undefined`; application fixtures can
still contain `null` under the declared types. Check both with optional
chaining or `!= null`. Unknown capacity is not a measured zero.

```typescript
import type {
  BackupList,
  IndexModel,
  ReadCapacityStatus,
} from '@pinecone-database/pinecone';

function responseSummary(
  index: IndexModel,
  backups: BackupList,
  capacity: ReadCapacityStatus,
) {
  return {
    tags: Object.entries(index.tags ?? {}),
    nextBackupPage: backups.pagination?.next,
    replicas:
      capacity.currentReplicas == null
        ? 'unknown'
        : String(capacity.currentReplicas),
    shards:
      capacity.currentShards == null
        ? 'unknown'
        : String(capacity.currentShards),
  };
}
```

## Required search fields and pagination fixtures

`SearchMatchTerms.strategy` and `terms`, previously optional, are now required.
Replace an empty or partial match-terms object with both fields (currently
`strategy: 'all'`), or omit the enclosing optional `matchTerms` filter when no
filter is intended. This is a declaration tightening; the serializer does not
invent defaults or validate incomplete JavaScript objects.

`Pagination.next` is also required when a pagination object exists. Replace
old fixtures containing `pagination: {}` with either a cursor or an omitted
pagination envelope for the final page. A required `next` does not mean every
list response has another page. The backup envelope uses the separate
`BackupListPagination` type and can also be null.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import type {
  ListResponse,
  Pagination,
  SearchMatchTerms,
} from '@pinecone-database/pinecone';

const matchTerms: SearchMatchTerms = { strategy: 'all', terms: ['animal'] };
const cursor: Pagination = { next: 'opaque-service-token' };
const pageWithMore: ListResponse = {
  vectors: [{ id: 'a' }],
  pagination: cursor,
};
const finalPage: ListResponse = { vectors: [{ id: 'b' }] };

const pc = new Pinecone();
const index = pc.index('my-vector-index');
let page = await index.listPaginated({ limit: 100 });
while (page.pagination?.next) {
  page = await index.listPaginated({
    limit: 100,
    paginationToken: page.pagination.next,
  });
}
console.log(matchTerms, pageWithMore, finalPage);
```

## `configureIndex` changed shape

The resource call takes the index name as its own argument rather than a field
inside the options object: `pc.indexes.configure(name, options)`. The
deprecated `pc.configureIndex({ name, ...options })` delegate keeps that
argument arrangement. Legacy `podReplicas` and `podType` remain accepted and
translate to `deployment`; do not mix `deployment` with those deprecated
fields in the same call. Top-level `embed` must move to the schema patch:

| v8 configuration field | Native equivalent                                         |
| ---------------------- | --------------------------------------------------------- |
| `podReplicas`          | `deployment.replicas`                                     |
| `podType`              | `deployment.podType`                                      |
| `embed`                | `schema.fields.<name>` (a `PatchSemanticTextField` entry) |

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const indexModel = await pc.indexes.configure('my-schema-index', {
  deletionProtection: 'enabled',
  tags: { team: 'ml-platform' },
  deployment: { replicas: 2 },
});
```

Only the fields present in `options` are updated; omit a field to leave it
unchanged.

## Vectors and documents

Which data-plane methods an index supports depends on its schema, not on when
you created it:

- Vector indexes use reserved `_values` or `_sparse_values` schema fields,
  whether created with native options or the supported
  `dimension`/`metric`/`spec` request shape. The `upsert`, `query`, `fetch`,
  `update`, the `delete*` methods, `listPaginated`, and `describeIndexStats`
  on `Index` are unchanged.
- Indexes created with custom named schema fields use document operations:
  `index.documents.upsert`, `search`, `fetch`, `update`, `list`, and `delete`,
  scoped by `.namespace()`
  the same way the vector methods are. Calling a method the index's schema
  does not support returns an error from the server.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

// Vector operations, supported for new and existing vector indexes
const vectorIndex = pc.index('my-vector-index');
await vectorIndex.upsert({
  records: [{ id: 'a', values: [0.1, 0.2, 0.3] }],
});

// Document operations, for indexes with custom named schema fields
const documentIndex = pc.index('my-schema-index');
await documentIndex.namespace('my-namespace').documents.upsert({
  documents: [{ _id: 'doc-1', chunk_text: 'hello world' }],
});
```

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

By default, API requests carry `X-Pinecone-Api-Version: 2026-07`. To talk to an
older version of the API, pass the header through `additionalHeaders`:

```typescript
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
  additionalHeaders: { 'X-Pinecone-Api-Version': '2026-01' },
});
```

In v8.x that entry was accepted and then discarded: each generated operation re-sent the
SDK's own version as a per-call header, and per-call headers won. Requests went out on the
SDK's version with no error and no warning. In v9, `additionalHeaders` is applied last, so
an entry keyed exactly `X-Pinecone-Api-Version` replaces the SDK's value on every request
that client makes, control plane and data plane alike, including the clients handed back by
`pc.index(...)`, `pc.Index(...)`, `pc.assistant(...)`, and `pc.Assistant(...)`. Headers
passed to one of those, through `pc.index({ additionalHeaders })` or the legacy third
argument, are merged over the client's and win on an exact key match.

Matching is case-sensitive, so `x-pinecone-api-version` is sent alongside the SDK's header
rather than replacing it. `Api-Key`, `User-Agent`, and the Admin client's `Authorization`
follow the same last-write-wins rule. `Content-Type` is protected regardless of header casing: the request body is already
encoded by the time `additionalHeaders` are applied, so overriding it would only mislabel
the body.

Two limits are worth knowing before you pin. The SDK does not validate the value — the API
decides which versions it still serves and rejects the rest. And v9's request and response
models are generated from the 2026-07 schemas, so a pinned client can send and receive
shapes those models do not describe. Keep a pinned client scoped to the calls that need the
older version rather than using it as a general downgrade.

## Pod indexes can no longer be created

`Indexes.create`'s `deployment` accepts `deploymentType: 'managed'` or
`'byoc'` only — there is no pod option, and the server rejects an attempt to
create one on the 2026-07 API version.

Existing pod indexes are unaffected: `pc.indexes.describe`, `pc.indexes.list`,
`pc.indexes.configure`, and `pc.indexes.delete` all still work on them, and
`IndexModel.deployment` reports `deploymentType: 'pod'` with the pod
environment, replica, and shard counts.

Collections — static copies of pod-based indexes — are a consequence of this:
`pc.collections.create` still requires a `source` index that is itself
pod-based, so it remains usable only against a pod index that predates this
change. There is no path to create a new pod index to source a collection
from.

## Superseded assistant model names now reach the server as-is

Two model names accepted by earlier assistant releases are superseded:
`claude-3-5-sonnet` and `claude-3-7-sonnet` both map to `claude-sonnet-4-5`.

The client does not remap or reject either name itself — the `model`
parameter accepts any string — so passing one of the old names reaches the
server, which returns a 400 error listing the accepted values. Pass
`claude-sonnet-4-5` (or another current model) directly. (The Python client
remaps the old names to `claude-sonnet-4-5` silently instead of erroring —
see below.)

## Coming from the Python client

### Backups

Python splits backup operations across two clients; TypeScript keeps them on
one:

| Python v10                                                     | TypeScript v9                 |
| -------------------------------------------------------------- | ----------------------------- |
| `pc.indexes.create_backup(...)` or `pc.backups.create(...)`    | `pc.backups.create(...)`      |
| `pc.indexes.list_backups(name)`                                | `pc.backups.listByIndex(...)` |
| `pc.backups.list()`                                            | `pc.backups.list()`           |
| `pc.indexes.describe_backup(id)` or `pc.backups.describe(...)` | `pc.backups.describe(...)`    |

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const backup = await pc.backups.create('my-schema-index', {
  name: 'weekly-backup',
});
const indexBackups = await pc.backups.listByIndex('my-schema-index');
const projectBackups = await pc.backups.list();
const described = await pc.backups.describe(backup.backupId);
```

### No `SchemaBuilder`

Python offers a `SchemaBuilder` helper for assembling an index schema.
TypeScript has no equivalent — the `schema: { fields: { ... } }` object
literal shown throughout this guide is the intended path, and your editor
completes the field union (`dense_vector`, `sparse_vector`, a `string` field
with `fullTextSearch`, and so on) as you type. Schema constraints — field
counts, at most one dense and one sparse field, full-text-search option
combinations — are validated by the server at `create` time, not pre-checked
by the client.

### Assistant model names

`claude-3-5-sonnet` and `claude-3-7-sonnet` both map to
`claude-sonnet-4-5` — see "Superseded assistant model names now reach the
server as-is" above. The TypeScript client errors via the server rather than
remapping; Python remaps silently.

## Removed and renamed exports

v9 removed the `preview`/alpha surface as the 2026-07 shape graduated to the
stable API. Some v8 types remain as deprecated compatibility exports; the
tables below distinguish those from removed names.

### The preview surface graduated

Every `Preview`-prefixed export was removed. In almost every case the stable
replacement is the same name with the `Preview` prefix dropped — for example,
`PreviewCreateIndexOptions` became `CreateIndexOptions`, `PreviewIndexSchema`
became `IndexSchema`, and `PreviewDocumentRecord` became `DocumentRecord`. This
covers `PreviewBooleanField`, `PreviewByocDeployment`,
`PreviewCollectionList`/`Model`, `PreviewCreateCollectionOptions`,
`PreviewCreateIndexSchema`/`Field`, `PreviewDeleteDocumentsOptions`,
`PreviewDenseVectorField`, `PreviewDocumentFetchUsage`, `PreviewDocumentRecord`,
`PreviewDocumentScoringMethod`, `PreviewDocumentSearchMatch`/`Usage`,
`PreviewFetchDocumentsOptions`/`Response`, `PreviewFetchedDocument`,
`PreviewFloatField`, `PreviewIndexDeployment`/`Request`,
`PreviewIntegerField`, `PreviewLegacyMetadataField`,
`PreviewListIndexBackupsOptions`/`ProjectBackupsOptions`/`RestoreJobsOptions`,
`PreviewManagedDeployment`, `PreviewPaginationResponse`,
`PreviewPatchIndexDeploymentRequest`/`Schema`, `PreviewPatchSemanticTextField`,
`PreviewPodDeployment`,
`PreviewResponseStringField`/`FullTextSearch`,
`PreviewScalingConfigManual`, `PreviewSearchDocumentsOptions`/`Response`,
`PreviewSemanticTextField`, `PreviewSparseValues`/`VectorField`,
`PreviewStringField`/`FullTextSearch`/`ListField`, `PreviewTypedIndexSchemaField`,
`PreviewUpsertDocumentsOptions`/`Response`, `PreviewIndexes`, and the bare
`Preview` namespace object itself.

The remaining `Preview`-prefixed names map to a stable name that already
existed under its plain name before v9 and changed shape rather than being
introduced fresh, so they are covered by the tables elsewhere in this guide
instead of repeated here: `PreviewBackupList`/`Model` and `PreviewIndexList`,
`PreviewIndexModel`/`Status` map to the changed `BackupList`/`BackupModel` and
`IndexList`/`IndexModel`/`IndexModelStatus` above; `PreviewConfigureIndexOptions`
and `PreviewCreateIndexOptions` map to the changed `ConfigureIndexOptions` and
`CreateIndexOptions` above; `PreviewIndex` maps to the existing (unchanged)
`Index` class, and `PreviewReadCapacity*` maps to the changed `ReadCapacity*`
family; `PreviewCreateBackupOptions`,
`PreviewCreateIndexFromBackupOptions`/`Response`, and
`PreviewRestoreJobList`/`Model` map to `CreateBackupOptions`,
`CreateIndexFromBackupOptions`/`Response`, and `RestoreJobList`/`Model`. These
stable names are not all unchanged: identifier placement and restore timestamp
nullability require the migrations described in this guide.

### Retained legacy request types

`LegacyCreateIndexOptions`, `LegacyCreateIndexSpec`, `CreateIndexSpec`,
`CreateIndexServerlessSpec`, `CreateIndexByocSpec`, `CreateIndexPodSpec`, and
`CreateIndexReadCapacity` are exported for compatibility. The pod spec type
remains nameable, but creating a pod index is rejected at runtime.
`CreateIndexReadCapacity` retains the flat dedicated shape (`nodeType` and
`manual`, with an optional `mode`) as well as on-demand mode. Legacy creation
accepts this shape or native nested capacity at the top level and inside
`spec.serverless` or `spec.byoc`; top-level capacity takes precedence. The
translator infers `Dedicated` from flat settings and emits the native nested
`dedicated` shape. Empty legacy capacity defaults to `OnDemand`.

`LegacyConfigureIndexOptions` also remains exported. Prefer
`NativeCreateIndexOptions`, `NativeConfigureIndexOptions`, and the native
schema/deployment types when adopting the new request shape.

### Retained legacy response types

`IndexModelSpec`, `ModelIndexEmbed`, `ServerlessSpecResponse`,
`ByocSpecResponse`, and `PodSpec` remain exported as deprecated compatibility
aliases. They describe the derived legacy properties above; they do not restore
all v8 response fields or permit pod creation. Prefer `IndexDeployment` and the
schema field types when reading native responses. `IndexModelData` describes
the native response without compatibility getters and is suitable for fixtures
and plain copied response objects.

### Removed v8 index-spec types

| Removed export                                | Replacement                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PodSpecMetadataConfig`, `PodBased`           | None — pod indexes cannot be created; see above                                                                                                                             |
| `ServerlessSpec`, `Serverless2`               | `{ deploymentType: 'managed', cloud, region }` on `deployment`                                                                                                              |
| `ByocSpec`, `BYOC2`                           | `{ deploymentType: 'byoc', environment }` on `deployment`                                                                                                                   |
| `ConfigureIndexRequestSpec`                   | `PatchIndexDeploymentRequest` on `ConfigureIndexResourceOptions.deployment`                                                                                                 |
| `ConfigureIndexRequestEmbed`                  | `PatchSemanticTextField` on `ConfigureIndexResourceOptions.schema`, or `CreateIndexForModelEmbed` at creation                                                               |
| `MetadataSchema`, `MetadataSchemaFieldsValue` | No direct replacement. Remove legacy metadata-indexing configuration; searchable document fields use `CreateIndexSchema`/`CreateIndexSchemaField` with different semantics. |
| `ReadCapacityDedicatedSpec`                   | `ReadCapacityDedicated`, `ReadCapacityDedicatedSettings`                                                                                                                    |
| `ReadCapacityOnDemandSpec`                    | `ReadCapacityOnDemand`                                                                                                                                                      |

<a id="removed-identifier-and-listing-option-aliases"></a>

### Retained identifier and listing option aliases

`DeleteIndexOptions`, `DescribeIndexOptions`, `DeleteCollectionOptions`,
`DescribeCollectionOptions`, `DeleteBackupOptions`, `DescribeBackupOptions`,
and `DescribeRestoreJobOptions` remain exported as deprecated string aliases.
Their calls still accept string identifiers.

The named options for flat calls also retain their identifier fields. Use the
resource-specific options when passing an identifier as a separate argument:

| Flat-call options              | Identifier field     | Resource-call options                                    |
| ------------------------------ | -------------------- | -------------------------------------------------------- |
| `ConfigureIndexOptions`        | `name`               | `ConfigureIndexResourceOptions`                          |
| `CreateBackupOptions`          | `indexName`          | `CreateBackupResourceOptions`                            |
| `CreateIndexFromBackupOptions` | `backupId`           | `CreateIndexFromBackupResourceOptions`                   |
| `ListBackupsOptions`           | Optional `indexName` | `ListIndexBackupsOptions` or `ListProjectBackupsOptions` |

For example, keep `CreateBackupOptions` for `pc.createBackup(options)`, or
switch to `CreateBackupResourceOptions` for `pc.backups.create(indexName, options)`.
`ListBackupsOptions` remains a deprecated options type for `pc.listBackups`;
omitting `indexName` lists project backups.

`ReadCapacityOnDemandParams` and `ReadCapacityDedicatedParams` remain exported
as deprecated aliases for the flat capacity shape. `createForModel` and
`backups.createIndex` accept supported flat or native nested capacity options.
For new code, use `ReadCapacityOnDemand` or `ReadCapacityDedicated` with the
native nested shape.

`BackupPaginationResponse` was renamed to `BackupListPagination`, the type of
`BackupList.pagination`.

<a id="pending-compatibility-work"></a>

## Copying and persisting index responses

The legacy properties are lazy, nonenumerable getters. Direct reads
can derive a supported legacy equivalent, but spread, `Object.assign`,
`structuredClone`, and JSON serialization omit those properties. A plain
parsed or copied object does not acquire the getters merely because it is
asserted to be an `IndexModel`; use `IndexModelData` for the native data shape.

For copied or persisted index responses, use the native `schema` and
`deployment`, or define an explicit application projection from the selected
schema field. The example returns `undefined` if the selected field is absent
or is not a dense vector.

```typescript
import type { IndexModelData } from '@pinecone-database/pinecone';

function denseVectorSnapshot(model: IndexModelData, fieldName: string) {
  const field = model.schema.fields[fieldName];
  if (!field || !('type' in field) || field.type !== 'dense_vector')
    return undefined;
  return {
    name: model.name,
    fieldName,
    dimension: field.dimension,
    metric: field.metric,
    vectorType: 'dense' as const,
  };
}
```

API-version pinning selects a server API version; it does not replace v9's
generated request serializers, response decoders, or TypeScript declarations.
It cannot recover v8 types or timestamp representations.
