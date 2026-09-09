# Contributing

We welcome contributions to this project.

## Node.js and npm

Use the Node.js major in `.nvmrc` and the exact npm version in `package.json`'s
`packageManager` field. With nvm installed, bootstrap from the repository root:

```bash
nvm install
nvm use
bash scripts/setup-npm.sh
npm ci
```

The bootstrap installs the pinned npm into the active Node installation and verifies
that it is on PATH. Run it again after switching Node versions. `packageManager`
records the pin; npm itself does not switch versions from that field, and Corepack's
npm shim is not enabled by default. Do not rely on the npm bundled with Node.

Use this npm for `npm install` when changing dependencies, and commit both
`package.json` and `package-lock.json`. CI and releases run the same bootstrap before
installing. The Node 22/24 matrix uses the same npm 11 resolver on each runtime and
keeps `npm ci` lockfile validation, including on Dependabot PRs. This does not assume
that Dependabot honors `packageManager`: CI checks its generated lockfile directly.

When changing the npm pin, regenerate the lockfile with that version and verify both
matrix runtimes. The development Node version must meet npm's own engine requirement
(npm 11 requires Node >=22.9.0 on the Node 22 line); `nvm install` selects the latest
patch. The published SDK's Node support is declared separately in `engines.node`.

## Repl

For quick troubleshooting, there is a repl available by running `npm run repl`. This will start a Node.js repl with the
`@pinecone-database/pinecone` package preloaded. The `npm` command runs the file `scripts/replInit.ts`.

## Building

```bash
npm run build
```

## Linting and formatting

```bash
npm run lint
npm run format
```

## Regenerating types from the OpenAPI spec

The OpenAPI specs live in the `codegen/apis` git submodule, which is not checked out by a plain
`git clone`. Initialize it first:

```bash
git submodule update --init
```

If you need to regenerate the TypeScript types from the OpenAPI spec (e.g. after a spec update), run:

```bash
npm run generate:openapi
```

This checks out `codegen/apis` at the commit pinned by this repository, rebuilds the generated
code under `src/pinecone-generated-ts-fetch/`, then runs `build` and `format` automatically. To
check out the `apis` repo's latest `main` instead of the pinned commit, run the script directly
with `--update-pin` as its second argument, then run `build` and `format` yourself, since this
path bypasses `npm run generate:openapi`:

```bash
./codegen/build-oas.sh 2026-07 --update-pin
npm run build
npm run format
```

`--update-pin` only changes what's checked out in your working tree. To keep the new `apis`
commit, commit the updated `codegen/apis` pointer in this repository as its own step.

## Documented examples

Every fenced `typescript` block in `README.md` and `guides/**/*.md`, plus fenced
`typescript` blocks under TSDoc `@example` tags in handwritten `src/**/*.ts`, is
type-checked in CI. Generated `src/pinecone-generated-ts-fetch*/` trees are excluded:

```bash
npm run docs:examples
```

A block that documents a prior major version (marked `**Before` in a migration guide, or
importing the removed `PineconeClient` class) is skipped. Anything else that fails to compile
must either be fixed or added to `docs-examples/known-failures.json`. The failure output prints
a ready-to-paste entry, keyed by the file and a hash of the block's own content so an unrelated
edit elsewhere in the file can't shift which block an entry points at. An entry whose example
starts compiling, or whose hash no longer matches anything (the example was edited, moved, or
excluded), fails the check, so the list only grows for real, tracked drift.

Examples are checked as separate modules. Relative imports resolve from the documented file's
directory. Free `pc`/`pinecone`, `index`, and `assistant` variables use their real SDK types,
and a free `Pinecone` constructor uses the SDK export. Other free identifiers are reported
and shimmed as `any`; provide explicit imports or declarations when their types matter.
Markdown and TSDoc examples share the same content-hash baseline.

## Local testing

To run all tests locally, excluding the unit tests, you will need to set your Pinecone API key to an environment
variable (or hard-code it in a .env file in this repo).

You can retrieve your API key from [app.pinecone.io](https://app.pinecone.io).

```bash
export PINECONE_API_KEY=your_api_key
```

To see the exact commands run by the aliases mentioned in this doc, see the `scripts` section in the `package.json`
file.

### Unit tests

Simply run `npm run test:unit` to run all unit tests.

### Integration tests

Run `npm run test:integration:local` to run all integration tests against the Node.js runtime, or
`npm run test:integration:local:edge` to run them against the Edge runtime.

### External app tests

Simply run `npm run test:external-app-local` to run all tests that integrate with the `ts-client-test-external-app` repo:

The `npm` command runs the bash file located in the `src/external-app` directory.

## API reference documentation

Run `npm run docs:build` to validate and render the API reference. Handwritten
comments must have no warnings: missing documentation and broken links fail the
build. Generated models remain in the reference, but warnings whose source is
under `src/pinecone-generated-ts-fetch/` or `src/pinecone-generated-ts-fetch-alpha/`
are excluded by `assets/docs-validation.mjs`. Warnings without an identified
generated source still fail, including handwritten links to generated types.
