# Document import fixture prerequisites (#38)

This synthetic fixture contains four documents, two in each namespace. Upload
only the `namespace1/` and `namespace2/` directories beneath a dedicated object
storage prefix; the import URI must name that parent prefix. Keep the existing
legacy Parquet fixture unchanged.

The target must be a document index with `embedding` as a `dense_vector` field
(dimension 2, metric `cosine`) and `text` as a `string` field. Each JSONL line is
one document with `_id` plus its fields. The files contain no customer data.

## Contract evidence

The pinned 2026-07 API specification at `e5d9362f0dd3363228fcf4220002c9820927c5d5`
and the generated `StartImportRequest` still describe only Parquet. The SDK uses
the existing `startImport({ uri, integrationId? })` operation; there is no
separate document-import route or format selector in the generated request.

Read-only inspection of backend source at
`f644831c7d1561ed2f7da539bb93119a4249eeee` establishes the intended document path:

- `data-importer/src/source/bulk_import.rs`: document indexes discover `.jsonl`
  and `.jsonl.gz` files; the first directory beneath the URI prefix is the
  namespace. Legacy indexes discover Parquet.
- `pc-vector-lsm/src/reader/jsonl.rs`: each line carries `_id` and document fields,
  validated against the index schema.
- `data-importer/src/bulk_import/partition/mod.rs`: the document partition path
  uses that JSONL reader and schema validator.

These are source-contract findings, not proof that the same backend revision is
deployed in the integration project's region. No live document import has been
validated with these files.

## Remaining prerequisites

1. A storage owner must provide a durable bucket/container prefix accessible to
   the integration project, upload these namespace directories, and record the
   URI plus any required storage integration ID. A local file path cannot be
   imported by the service.
2. Confirm document import is enabled in the target region and that the deployed
   implementation accepts this fixture. Reconcile the Parquet-only API prose
   with the API owner before treating it as supported release documentation.
3. Add a live test using an index owned exclusively by that test. Assert start,
   describe and list by the returned import ID; in a completion run, wait for
   `Completed` with `recordsImported: 4` and fetch both expected document IDs from
   each namespace, comparing vectors and text. A start/cancel-only check does
   not validate JSONL decoding or ingestion.
4. Bound completion polling, fail promptly on terminal import failure, and clean
   up the owned index in `finally`. Record the verified fixture URI, backend
   region, and successful run before closing #38.

PR #139 already restored legacy Parquet lifecycle coverage. Keep #38 open for
this document-specific live validation; neither a mocked request nor local
JSON parsing satisfies it. No cloud upload is performed by this fixture.
