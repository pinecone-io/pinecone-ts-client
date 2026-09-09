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
