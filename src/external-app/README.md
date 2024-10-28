# End-to-end tests

## Local runs

See CONTRIBUTING.md for instructions. **TLDR:** the `npm` command outlined in `package.json > scripts` runs the bash file located in this directory.

## CI runs

The CI runs for the end-to-end tests are defined in the `.github` directory.

The `Action` in Github is called `End to end testing`.

- Workflow
  - The workflow run by CI is called `workflows/e2d-testing.yml`
  - It requires a Pinecone API key and a Vercel token.
    - The Pinecone API key it uses the associated with the `ops@` account and is stored in a Github secret
    - The Vercel token is from the Pinecone Enterprise account and is stored in a Github secret
- Action
  - The action run by the workflow is called `actions/e2e-testing/edge/action.yml`
  - This action packages the `ts-client` code on the current branch into the external app's repo
  - It then installs the Vercel CLI and sends a POST request to the test app's `/api/createSeedQuery` endpoint,
    which is up and running on Vercel
  - If the response from the endpoint does not include a match (a match to a query composed by
    the test app), the action fails
  - The action then deletes the index that the test app spun up (note: it will attempt to delete the index even if
    the assertions fail)

Notes:

- The test app is located in the public [`ts-client-test-external-app` repo](https://github.com/pinecone-io/ts-client-test-external-app)
- The test app's API is already deployed to Production in Pinecone's Enterprise Vercel account; the action will fail if
  this app is rolled back, so please do not do that :)
- The test app's endpoint that the `ts-client` tests hit is: `ts-client-test-external-app.vercel.app/api/createSeedQuery`
