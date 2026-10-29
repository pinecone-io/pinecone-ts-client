# AGENTS.md

Guidance for AI coding agents working in this repository. Human-oriented setup
and process docs live in [CONTRIBUTING.md](./CONTRIBUTING.md) and
[RELEASING.md](./RELEASING.md); read them when a task touches those areas.

## What this repo is

The official Pinecone TypeScript SDK, published to npm as
`@pinecone-database/pinecone`. It wraps the Pinecone control plane (indexes,
collections, backups, restore jobs), data plane (vectors, documents,
namespaces, bulk import), inference, Assistant, and Admin APIs.

Development and review happen in the **internal mirror** (`pinecone-io/pinecone-ts-client-internal`).
Reviewed `main` is pushed to the public repo (`pinecone-io/pinecone-ts-client`) with `scripts/sync_to_public.sh`,
and npm releases run from the public repo. Consequences:

- Everything reachable from internal `main` becomes public on the next sync.
  Do not commit secrets, internal URLs, customer data, or internal-only notes.
- Public history must stay a fast-forward of internal history. Never rewrite or
  force-push `main`.
- External contributions arrive as public PRs and are pulled into the internal mirror manually.

## Environment

- Node major from `.nvmrc` (22); the published package supports Node `>=22`.
- Exact npm version from `package.json` `packageManager`. Bootstrap with
  `nvm use && bash scripts/setup-npm.sh && npm ci`. Do not use the npm bundled
  with Node to change dependencies; always commit `package.json` and
  `package-lock.json` together.
- `codegen/apis` is a git submodule containing the OpenAPI specs. It is only
  needed for regenerating code: `git submodule update --init`.
- Integration tests need `PINECONE_API_KEY` (see `.env.example`). Unit, smoke,
  and typecheck commands do not. Some suites are opt-in:
  `PINECONE_LONG_RUNNING_INTEGRATION=1` enables slow backup/restore and bulk
  import paths, and `PINECONE_COLLECTION_SOURCE_INDEX` enables the collection
  lifecycle (see `src/integration/control/README.md`).
- `PINECONE_CLIENT_ID` / `PINECONE_CLIENT_SECRET` (service-account credentials)
  are read by `AdminClient` and `npm run repl`. No integration suite exercises
  the Admin API yet; its coverage is unit tests with mocked transport.
- `PINECONE_DEBUG=1` / `PINECONE_DEBUG_CURL=1` log requests (credentials are
  redacted).

## Commands

| Task                                        | Command                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Build (`dist/`)                             | `npm run build`                                                          |
| Typecheck src, scripts, consumer fixtures   | `npm run typecheck`                                                      |
| Lint                                        | `npm run lint`                                                           |
| Format (writes files)                       | `npm run format`                                                         |
| Unit tests                                  | `npm run test:unit` (single file: `npx jest path/to/file.test.ts`)       |
| Mocked smoke tests (no key)                 | `npm run test:smoke:mocked`                                              |
| Compile documented examples                 | `npm run docs:examples`                                                  |
| Render/validate API reference               | `npm run docs:build`                                                     |
| Verify published declarations / source maps | `npm run verify:declarations`, `npm run verify:sourcemaps` (after build) |
| Integration tests (live, needs key)         | `npm run test:integration:local` / `npm run test:integration:local:edge` |
| Regenerate OpenAPI clients                  | `npm run generate:openapi -- 2026-07`                                    |

Some unit tests (e.g. `src/__tests__/entryNodeBuiltins.test.ts`) read `dist/`,
so run `npm run build` before `npm run test:unit` on a fresh checkout.

Before calling a change done, run at least: `npm run build`, `npm run typecheck`,
`npm run lint`, `npm run format` (and check `git diff` is clean of formatting
changes), and `npm run test:unit`. Add `npm run docs:examples` if you touched
Markdown, guides, or TSDoc `@example` blocks, and `npm run test:smoke:mocked` if
you touched request/response plumbing. Do not run integration tests unless asked;
they create and delete real Pinecone resources.

## Layout

```
src/
  index.ts                     public barrel; everything exported here is public API
  pinecone.ts                  Pinecone client class (entry point for users)
  control/                     indexes, collections, backups, backupSchedules, restoreJobs
  data/                        Index class; vectors/, documents/, namespaces/, bulk/
  inference/                   embed, rerank, models
  assistant/                   Assistant control + data plane, chat streaming
  admin/                       AdminClient (service-account org/project/API-key management)
  errors/                      BasePineconeError hierarchy and HTTP error mapping
  utils/                       fetch, middleware, retries, headers, user agent, debug logging
  pinecone-generated-ts-fetch/ GENERATED OpenAPI clients - do not hand-edit
  integration/                 live integration tests + setup/teardown fixtures
  smoke/                       key-free tests against a mocked fetch transport
  __tests__/                   repo-wide contract/guard tests
codegen/                       generation scripts and post-processing; apis/ submodule
guides/                        user-facing Markdown guides (examples are type-checked)
ts-compilation-test/           consumer-side compile tests against the packed SDK
ts-external-app-test/          external sample-app harness
scripts/                       build, verification, REPL, sync, and test helpers
docs-examples/known-failures.json  baseline for doc examples allowed to fail compilation
release/                       release audit notes
```

`dist/`, `docs/`, `build/`, and `coverage/` are generated and gitignored.

## Code conventions

These match `.cursor/rules/best-practices.mdc` and `.cursor/BUGBOT.md`, which
reviewers apply.

- **Operation pattern.** Data/control operations are small modules (for example
  `src/data/vectors/deleteOne.ts`) that export an options type and a factory
  taking an operations provider. The factory validates input, calls
  `provider.provide()` to get the generated API client, and passes the pinned
  `X_PINECONE_API_VERSION` from the generated module. Follow the neighboring
  files rather than inventing a new shape.
- **Errors.** Throw classes from `src/errors` (`PineconeArgumentError` for bad
  input, etc.), never bare `Error`. Preserve causes with `new ErrorClass(message, cause)`.
  HTTP status mapping lives in `src/errors/http.ts`/`handling.ts`.
- **Validation.** Validate early in public methods with clear, actionable
  messages; check `null`/`undefined`/empty explicitly.
- **TSDoc.** Every public class, method, and type needs accurate TSDoc with
  `@param`, `@returns`, `@throws`, and a ` ```typescript ` `@example` for
  public APIs. Mark internal APIs `/** @internal */`. `npm run docs:build` fails
  on warnings for handwritten code, and `@example` blocks are compiled by
  `npm run docs:examples`.
- **Style.** Prettier and ESLint configs are authoritative. Avoid `any`. Keep
  modules single-purpose; split files that grow past ~800 lines.
- **Comments.** Explain _why_ (constraints, spec quirks, compatibility reasons),
  not what the code does.

## Public API and compatibility

- The exported surface is pinned by `src/__tests__/publicContract.test.ts`
  (snapshot). Adding or removing an export changes the snapshot; update it
  deliberately (`npx jest src/__tests__/publicContract.test.ts -u`) and call it
  out in the PR.
- v9 kept legacy entry points (`pc.createIndex`, `pc.Index`, flat vector
  methods, etc.) as deprecated delegates. `backward-compat.test.ts`,
  `legacyControlPlaneSurface.test.ts`, and `ts-compilation-test/` guard them. Do
  not remove or change their signatures without explicit instruction; breaking
  changes need a migration note in `guides/upgrading/` and `@deprecated` tags.
- The SDK pins one API version (currently `2026-07`). Users may override it via
  headers; see `src/utils/middleware.ts` and `apiVersionPinning.test.ts`.

## Generated code

- Never hand-edit `src/pinecone-generated-ts-fetch/**`. Regenerate with
  `npm run generate:openapi -- <YYYY-MM>`, which requires Docker and the
  `codegen/apis` submodule, then runs build and format.
- Post-generation fixups live in `codegen/build-oas.sh` and
  `codegen/strip-validation-only-composition.mjs`, and are tested by
  `src/__tests__/codegenFixups.test.ts`. If generated output needs to change,
  change those (or the spec), not the output.
- Keep regeneration in its own commit/PR when possible, separate from
  handwritten changes that depend on it. Bumping the `codegen/apis` pointer is
  likewise its own step.

## Tests

- Unit tests sit in `__tests__/` next to the code they cover, using Jest
  `describe`/`test`. Mock the generated API client or inject `fetchApi`; never
  hit the network.
- `src/smoke/` tests run the real SDK through a mocked `fetch` and assert wire
  format. Use them for request/response serialization changes.
- Integration tests in `src/integration/` share fixtures created by
  `setup.ts` and passed via `FIXTURES_JSON` (see `src/integration/README.md`).
  They run under both Node and Edge runtimes.
- A skipped integration test must carry a tracking comment of the form
  `// @integration-skip #<issue>: <reason>`; `integrationSkipInventory.test.ts`
  fails on untracked skips.
- Cover both success and failure paths, including validation errors.

## Documentation

- Every ` ```typescript ` block in `README.md`, `guides/**/*.md`, and
  TSDoc `@example` tags must compile (`npm run docs:examples`). Fix failures
  rather than adding to `docs-examples/known-failures.json` unless the drift is
  intentional and tracked.
- Update the relevant guide in `guides/` when user-facing behavior changes.

## CI

`.github/workflows/pr.yml` runs on every PR: formatting check, lint, doc
examples, source-map and declaration verification, TypeDoc, typecheck, then
`testing.yml` (lockfile validation, unit tests with coverage, mocked smoke,
packed-package consumers on Node 22/24, Edge runtime entry, TS compilation
matrix, sample apps, and live integration tests). Docs-only PRs skip the heavy
jobs. Publishing and docs-deploy workflows are intentionally inert on the
internal mirror; do not add publishing secrets here.

## Commits and PRs

- Use Conventional Commits for titles: `fix:`, `feat:`, `docs:`, `test:`,
  `chore:`, `ci:`, `build(deps):`, with an optional scope (`feat(documents): ...`).
- PR descriptions: problem, solution, linked issues, and usage examples for new
  API. Call out any public API, snapshot, or compatibility changes.
- Do not bump `version` in `package.json` or edit `src/version.json`; the
  release workflow does that.
- When pulling in a public PR, keep the contributor's commits and authorship
  intact and note the public PR number.
