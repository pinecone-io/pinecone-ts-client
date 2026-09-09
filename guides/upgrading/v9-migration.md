# v9 Migration Guide

This guide covers breaking changes introduced in v9.x when upgrading from v8.x.
v9 targets the 2026-07 API version. The control plane uses resource namespaces,
new index definitions use a typed `schema`, and pod-based indexes can no longer
be created. Compatibility delegates and legacy request translation preserve
many v8 call sites; response shapes still require attention.

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

Two entries change identifier placement rather than just adding a namespace:
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

Native options describe document fields through `schema`, with an optional
`deployment` selecting infrastructure. Choose named fields for document-plane
applications. Keep the supported legacy shape for classic vector applications;
changing to an arbitrary named vector field is not a transparent migration of
an existing `index.upsert`/`index.query` workflow.

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

**Native schema: for document-plane applications**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

const indexModel = await pc.indexes.create({
  name: 'my-index',
  schema: {
    fields: {
      chunk_vector: { type: 'dense_vector', dimension: 1536, metric: 'cosine' },
    },
  },
  waitUntilReady: true,
});
```

`create` resolves to `IndexModel | void` (not just `IndexModel`): passing
`suppressConflicts: true` makes it resolve to `undefined` instead of throwing
when an index with that name already exists, so code that reads a property of
`indexModel` needs to narrow first.

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

## The index response lost its flat vector fields

`IndexModel` — returned by `describe` and `configure`, in `create`'s result,
and in each entry of `list`'s `indexes` array — no
longer has `dimension`, `metric`, `vectorType`, `spec`, or `embed`. Read each
value from `schema` or `deployment` instead:

| v8 field     | v9 equivalent                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `dimension`  | `schema.fields.<name>.dimension` on the `dense_vector` field                                        |
| `metric`     | `schema.fields.<name>.metric` on the `dense_vector` field                                           |
| `vectorType` | The `type` of the relevant `schema.fields` entry (`dense_vector`, `sparse_vector`, `semantic_text`) |
| `spec`       | `deployment` — `{ deploymentType: 'managed' \| 'byoc' \| 'pod', ... }`                              |
| `embed`      | The `semantic_text` field in `schema.fields`, if the index has one                                  |

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

`status`, `readCapacity`, and `deletionProtection` also changed shape — see
the `IndexModel` reference in the [API documentation](https://sdk.pinecone.io/typescript/interfaces/IndexModel.html) for the full type.

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

- Classic vector indexes (including new indexes created through the supported
  legacy `dimension`/`metric`/`spec` shape)
  keep serving the classical vector plane: `upsert`, `query`, `fetch`,
  `update`, the `delete*` methods, `listPaginated`, and `describeIndexStats`
  on `Index` are unchanged.
- Indexes created with custom document schema fields serve the document plane:
  `index.documents.upsert`, `search`, `fetch`, `update`, `list`, and `delete`,
  scoped by `.namespace()`
  the same way the vector methods are. Calling a method the index's schema
  does not support returns an error from the server.

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone();

// Classical vector plane — unchanged from v8
const vectorIndex = pc.index('my-vector-index');
await vectorIndex.upsert({
  records: [{ id: 'a', values: [0.1, 0.2, 0.3] }],
});

// Document plane — for indexes created with `schema`
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
`PreviewRestoreJobList`/`Model` map to the unchanged `CreateBackupOptions`,
`CreateIndexFromBackupOptions`/`Response`, and `RestoreJobList`/`Model`.

### Retained legacy request types

`LegacyCreateIndexOptions`, `LegacyCreateIndexSpec`, `CreateIndexSpec`,
`CreateIndexServerlessSpec`, `CreateIndexByocSpec`, `CreateIndexPodSpec`, and
`CreateIndexReadCapacity` are exported for compatibility. The pod spec type
remains nameable, but creating a pod index is rejected at runtime.
`LegacyConfigureIndexOptions` also remains exported. Prefer
`NativeCreateIndexOptions`, `NativeConfigureIndexOptions`, and the native
schema/deployment types when adopting the new request shape.

### Removed v8 index-spec types

| Removed export                                             | Replacement                                                                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PodSpec`, `PodSpecMetadataConfig`, `PodBased`             | None — pod indexes cannot be created; see above                                                                                                                             |
| `ServerlessSpec`, `ServerlessSpecResponse`, `Serverless2`  | `{ deploymentType: 'managed', cloud, region }` on `deployment`                                                                                                              |
| `ByocSpec`, `ByocSpecResponse`, `BYOC2`                    | `{ deploymentType: 'byoc', environment }` on `deployment`                                                                                                                   |
| `IndexModelSpec`                                           | `IndexDeployment` (the response shape of `deployment`)                                                                                                                      |
| `ConfigureIndexRequestSpec`                                | `PatchIndexDeploymentRequest` on `ConfigureIndexOptions.deployment`                                                                                                         |
| `ConfigureIndexRequestEmbed`, `ModelIndexEmbed`            | `PatchSemanticTextField` on `ConfigureIndexOptions.schema`, or `CreateIndexForModelEmbed` at creation                                                                       |
| `MetadataSchema`, `MetadataSchemaFieldsValue`              | No direct replacement. Remove legacy metadata-indexing configuration; searchable document fields use `CreateIndexSchema`/`CreateIndexSchemaField` with different semantics. |
| `ReadCapacityDedicatedSpec`, `ReadCapacityDedicatedParams` | `ReadCapacityDedicated`, `ReadCapacityDedicatedSettings`                                                                                                                    |
| `ReadCapacityOnDemandSpec`, `ReadCapacityOnDemandParams`   | `ReadCapacityOnDemand`                                                                                                                                                      |

### Options objects replaced by positional arguments

Several methods that took an options object with a single identifying field
now take that field as a plain argument instead:

| Removed export              | Replacement                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `DeleteIndexOptions`        | `Indexes.delete(name: string)`                                                                    |
| `DescribeIndexOptions`      | `Indexes.describe(name: string)`                                                                  |
| `DeleteCollectionOptions`   | `Collections.delete(name: string)`                                                                |
| `DescribeCollectionOptions` | `Collections.describe(name: string)`                                                              |
| `DeleteBackupOptions`       | `Backups.delete(backupId: string)`                                                                |
| `DescribeBackupOptions`     | `Backups.describe(backupId: string)`                                                              |
| `DescribeRestoreJobOptions` | `RestoreJobs.describe(jobId: string)`                                                             |
| `ListBackupsOptions`        | `ListIndexBackupsOptions` (`Backups.listByIndex`) or `ListProjectBackupsOptions` (`Backups.list`) |

`BackupPaginationResponse` was also renamed, to `BackupListPagination` — the
type of `BackupList.pagination`, unrelated to the options-object changes
above.

## Pending compatibility work

This guide describes the current implementation. Derived legacy response properties
are tracked in [PR #143](https://github.com/pinecone-io/pinecone-ts-client-internal/pull/143).
Update the response guidance when that change lands.

The batching engine is present, but public `index.documents.batchUpsert()`
exposure is tracked separately in
[issue #138](https://github.com/pinecone-io/pinecone-ts-client-internal/issues/138).
