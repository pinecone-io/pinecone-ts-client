# Backup and collection integration coverage

The default matrix exercises backup creation, both backup lists, description and deletion; restore acceptance and job description/listing; and unknown-backup errors. Each run owns and removes its indexes and backup.

Set `PINECONE_LONG_RUNNING_INTEGRATION=1` to additionally verify restored contents and read capacity end to end. This test deliberately waits 15 minutes after records become visible before creating the backup. Pinecone [documents](https://docs.pinecone.io/guides/manage-data/backups-overview#limitations) that backups only include vectors at least 15 minutes old; successful fetches and index stats do not establish backup eligibility. All readiness/completion checks use bounded polling. Allow up to one hour for the complete test, including cleanup. The ordinary matrix does not run this expensive path.

```sh
PINECONE_LONG_RUNNING_INTEGRATION=1 npm run test:integration:node -- --runTestsByPath src/integration/control/backups.test.ts
```

Set `PINECONE_COLLECTION_SOURCE_INDEX` to a dedicated, stable pod index to enable the collection lifecycle. Provision and age its records before running the suite. The source is only read and snapshotted: the suite never writes records or deletes the source. Only its newly created collection is deleted. The 2026-07 create API supports managed/BYOC deployments, so the SDK cannot provision this pod fixture. Without the variable the suite is explicitly skipped; track provisioning and matrix verification under #21.

The deterministic pending-backup rejection case under #117 still requires a fixture that can remain pending while the restore request executes; checking a status immediately before a request cannot prevent completion races.
