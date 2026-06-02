# Namespace Refactor Plan

Reorganize the flat methods on the `Pinecone` class into semantic namespaces
(`pc.indexes.*`, `pc.assistants.*`) before the major version bump that upgrades
stable APIs to `2026-04`.

## Motivation

The `Pinecone` class has grown to ~25 public methods. Grouping them into
namespaces improves discoverability, IDE autocomplete grouping, and aligns the
stable API surface with the `preview` and `inference` patterns already in place.

---

## Target API shape

```typescript
// Index + collection + backup + restore operations
pc.indexes.create(options)
pc.indexes.createForModel(options)
pc.indexes.configure(options)
pc.indexes.describe(name)
pc.indexes.list()
pc.indexes.deleteIndex(name)
pc.indexes.createCollection(options)
pc.indexes.describeCollection(name)
pc.indexes.listCollections()
pc.indexes.deleteCollection(name)
pc.indexes.createBackup(options)
pc.indexes.createFromBackup(options)
pc.indexes.describeBackup(backupId)
pc.indexes.deleteBackup(backupId)
pc.indexes.listBackups(options)
pc.indexes.describeRestoreJob(restoreJobId)
pc.indexes.listRestoreJobs(options)

// Assistant CRUD + evaluation
pc.assistants.createAssistant(options)
pc.assistants.describeAssistant(name)
pc.assistants.updateAssistant(options)
pc.assistants.listAssistants()
pc.assistants.deleteAssistant(name)
pc.assistants.evaluate(options)

// Unchanged — factory/targeting methods stay at top level
pc.index(options)       // returns Index instance
pc.assistant(options)   // returns Assistant instance

// Unchanged — already namespaced
pc.inference.*
pc.preview.*
```

---

## Implementation steps

### 1. Create `src/control/Indexes.ts`

A new class following the same pattern as `src/inference/Inference.ts`.

```typescript
export class Indexes {
  private _createIndex: ReturnType<typeof createIndex>;
  // ... all other private bound operations

  constructor(config: PineconeConfiguration) {
    const api = indexOperationsBuilder(config);
    this._createIndex = createIndex(api);
    // ...
    this.config = config;
  }
}
```

**Move the host-cache side-effect logic here** — currently the `Pinecone`
wrapper methods for `describeIndex`, `listIndexes`, and `deleteIndex` update
`IndexHostSingleton`. This logic should live in the `Indexes` class methods,
not in the `Pinecone` wrapper.

Export `Indexes` from `src/control/index.ts`.

### 2. Create `src/assistant/Assistants.ts`

Same pattern. Move `AssistantHostSingleton` side-effect logic (currently in
`createAssistant`, `describeAssistant`, `listAssistants`, `deleteAssistant` on
`Pinecone`) into the `Assistants` class methods.

Export `Assistants` from `src/assistant/control/index.ts` (or wherever the
assistant control barrel is).

### 3. Update `src/pinecone.ts`

**Add public namespace properties (instantiated in constructor):**

```typescript
public indexes: Indexes;
public assistants: Assistants;

// in constructor:
this.indexes = new Indexes(this.config);
this.assistants = new Assistants(this.config);
```

**Deprecate all affected flat methods** — each becomes a one-liner wrapper:

```typescript
/** @deprecated Use {@link indexes.createIndex} instead. Will be removed in the next major version. */
createIndex(options: CreateIndexOptions) {
  return this.indexes.createIndex(options);
}
```

The deprecated wrappers delegate entirely — no duplicated logic.

### 4. Update barrel exports

Ensure `Indexes` and `Assistants` are exported from the top-level `src/index.ts`
so users can import them for type annotations if needed:

```typescript
import type { Indexes } from '@pinecone-database/pinecone';
```

### 5. Update tests

- Unit tests for the flat methods on `Pinecone` can stay in place (they still
  work via the deprecated wrappers), or be migrated to test through the
  namespace — the latter is preferred for new tests going forward.
- Add unit test files for `Indexes` and `Assistants` classes covering the
  host-cache side-effect logic.

### 6. Update documentation / guides

- `guides/index-management/` examples use `pc.createIndex()` etc. — update to
  `pc.indexes.create()`.
- `guides/assistant/` examples — update to `pc.assistants.*`.
- JSDoc `@example` blocks in the new namespace class methods should reflect
  the new call paths.
- The top-level `pinecone.ts` JSDoc overview block should be updated to
  describe the namespace structure.

---

## Deprecation approach

All existing flat methods on `Pinecone` remain functional but are marked
`@deprecated` with a pointer to the namespace equivalent. They will be removed
in the same major version bump that ships the `2026-04` stable API upgrade.
This gives any users on the current version a deprecation warning window.

---

## What is explicitly out of scope

- Renaming methods within namespaces (e.g. `pc.indexes.create()` instead of
  `pc.indexes.createIndex()`). Method names stay identical to keep migration
  mechanical.
- Moving `pc.index()` / `pc.Index()` / `pc.assistant()` / `pc.Assistant()`
  factory/targeting methods — these stay at the top level.
- Any changes to `pc.inference` or `pc.preview` — already in the target shape.
- The `2026-04` stable API version bump — that is a separate PR after this one.

---

## File checklist

- [ ] `src/control/Indexes.ts` — new namespace class
- [ ] `src/assistant/Assistants.ts` — new namespace class
- [ ] `src/control/index.ts` — export `Indexes`
- [ ] `src/assistant/control/index.ts` (or equivalent barrel) — export `Assistants`
- [ ] `src/index.ts` — export `Indexes`, `Assistants` for type use
- [ ] `src/pinecone.ts` — add `indexes`, `assistants` properties; deprecate flat methods
- [ ] Unit tests for `Indexes` class
- [ ] Unit tests for `Assistants` class
- [ ] Update JSDoc `@example` blocks in new classes
- [ ] Update `guides/` examples
