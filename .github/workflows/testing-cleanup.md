# Cleanup test resources: schedule investigation

`testing-cleanup.yml` runs on a daily cron (`0 0 * * *`) to reclaim leaked integration test
resources (indexes, collections, assistants, backups) in the `sdk-node-testing` project. As of
2026-09-04 it had produced zero runs since the repository was created on 2026-08-20 — about 15
missed firings (issue #57). Measured leak rate over the last 36 integration runs: 17 leaked
shared fixtures, so this cron is the only backstop against those leaks accumulating.

## Root cause

Not confirmed. The workflow's `state` was `active` and repository-level Actions permissions were
`enabled`/`all`, which rules out the two most common causes (a disabled workflow, disabled
Actions). Two candidates remain open:

- **Import vs. push.** This repository's git history was imported wholesale from an existing
  project — commits date back to 2022, more than three years before this repository's
  2026-08-20 creation date — rather than built up from incremental pushes. `testing-cleanup.yml`
  itself was last content-modified in the source history on 2026-07-20, and the GitHub API's
  `updated_at` for this workflow equalled its `created_at`, consistent with GitHub's schedule
  indexer never having reprocessed it since the import. The commit that introduces this doc also
  edits `testing-cleanup.yml`, which is the first real push touching that file in this
  repository — a live test of the theory, not a confirmed fix.
- **Org-level Actions policy.** Could not be checked: `GET orgs/pinecone-io/actions/permissions`
  requires org-admin scope, which the investigating token lacked (403 response).

## If the cron is still dead

Both of these work today, independent of whether the push above fixed the schedule:

```
gh workflow run testing-cleanup.yml --repo pinecone-io/pinecone-ts-client-internal --ref main
gh api repos/pinecone-io/pinecone-ts-client-internal/dispatches -f event_type=cleanup-test-resources
```

The second relies on the `repository_dispatch` trigger on `testing-cleanup.yml`. Neither is
itself scheduled — something needs to call one of them on a recurring basis (a cron host outside
GitHub, a scheduled workflow in a different repository, or a hosted scheduler) for automatic
reclamation to resume without a human. Wiring up that caller is not done here.

If issue #57's second acceptance criterion — a scheduled run observed in the Actions tab,
unassisted — is still unmet a week after this merges, treat the import/push theory as
unconfirmed and check the org policy above next; that requires an organization admin.
