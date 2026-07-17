# Smoke tests

## Mocked critical-path gate (`mockedCriticalPath.test.ts`)

A key-free smoke gate that runs the critical **connect → upsert → query** path
against a mocked HTTP transport. It runs on **every pull request** (the
`Smoke (mocked, no key)` job in `.github/workflows/testing.yml`) with no
`PINECONE_API_KEY`, guarding the request/response plumbing against regressions
before any keyed suite runs.

The mock is injected at the transport layer via
`PineconeConfiguration.fetchApi` — the TypeScript analogue of the Python SDK's
respx-backed gate (`tests/smoke/test_mocked_critical_path_*.py`). Everything
above `fetch` (config resolution, host caching, request building, response
deserialization) is the real code path.

Run it locally:

```sh
npm run test:smoke:mocked
```

The dedicated config (`jest.config.smoke.js`) targets only `src/smoke/` and does
**not** pass `--passWithNoTests`, so the job fails if the suite ever collects
zero tests rather than silently passing.

## Real (keyed) suites

The keyed end-to-end tests live in `src/integration/` and run in the Testing
workflow with `PINECONE_API_KEY` supplied. They are gated separately from this
key-free gate.
