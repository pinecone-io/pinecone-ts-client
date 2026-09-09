# Release checklist

Use the public `pinecone-io/pinecone-ts-client` repository for publishing after
syncing the reviewed internal `main`. The internal mirror must keep
`SSH_DEPLOY_KEY` and `VERCEL_TOKEN` unset. Internal CI builds TypeDoc and checks
examples without publishing documentation; its sample-app jobs are intentionally
restricted to the public repository.

## Prepare privately

- Confirm the release candidate has passed unit, mocked smoke, declaration,
  supported TypeScript/runtime, and live integration checks. Record any skipped
  release coverage and its tracking issue.
- Review the v9 migration guide against the final SDK exports and compatibility
  delegates. Verify the 2026-07 API version throughout the generated clients.
- Prepare companion changes for `pinecone-io/ts-client-test-external-app` and
  `pinecone-io/semantic-search-example` in private checkouts. Install a packed
  candidate SDK into each and build/test locally. Existing deprecated delegates
  may make some migrations unnecessary; verify the actual applications instead
  of assuming every flat call must change.
- Record each companion commit, SDK candidate SHA, and validation result in the
  release tracking issue. Land necessary companion changes with the public SDK
  sync so the public sample-app CI validates the intended API surface.
- Internal mirrors of those applications are not currently configured. Before
  release, record either completed private application validation or an explicit
  release-owner acceptance of the remaining coverage gap (#5).

## Sync and publish

1. Sync the reviewed candidate to public `main` at the coordinated release time,
   together with the prepared companion application changes. Run the public CI
   checks, including the sample applications, and inspect their results.
2. Run the public repository's `Release: NPM Package` workflow on the intended
   release branch with tests enabled. For the v9 breaking release select the
   production mode and major version bump. The workflow publishes npm, pushes
   the version commit/tag, and creates a draft GitHub release; review the draft
   notes before publishing them.
3. Record the resulting version tag and commit. The release workflow currently
   also invokes docs publishing with its branch input, rather than a tag. Avoid
   advancing that release branch while it runs, and verify the checkout SHA in
   the docs job. To ensure the final docs correspond exactly to the released
   version, dispatch the docs workflow against the resulting tag as below.

## Publish documentation from the released tag

After the public sync and successful package release, substitute the actual
published tag and run:

```bash
gh workflow run build-and-publish-docs.yml \
  --repo pinecone-io/pinecone-ts-client \
  --ref v9.0.0
```

Use `--ref`, not `-f ref`: manual dispatch declares no `ref` input; the workflow
checks out the dispatch ref. The `ref` input exists only for reusable workflow
calls. Verify the run's checkout matches the released tag and its destination is
`pinecone-io/sdk-docs`, `main`, directory `typescript`. Check the rendered
`classes/Pinecone.html` reference page and guide links after deployment.

If publishing fails, keep the failure visible in the release tracking issue and
retry this tag-pinned dispatch after fixing the cause in the public release flow.
Do not configure publishing secrets on the internal mirror as a workaround.

See #4 for the docs publication decision and #5 for companion application
coverage. No publishing operation is performed by following the private
preparation steps above.
