# Contributing

We welcome contributions to this project.

## Repl

For quick troubleshooting, there is a repl available by running `npm run repl`. This will start a Node.js repl with the
`@pinecone-io/client` package preloaded. The `npm` command runs the file `utils/replInit.ts`.

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

Simply run `npm run test:integration-local:<runtime>` to run all integration tests, substituting `<runtime>` with
either `node` or `edge` as you see fit.

### End-to-end tests

Simply run `npm run test:end-to-end -- <path-for-cloned-repo>` to run all end-to-end tests, passing the `path` the repo should be
cloned in as a command line argument, e.g.:

```bash
npm run test:end-to-end -- ~/Desktop/tmp-dr
```

The `npm` command runs the bash file located in the `src/end-to-end` directory.

#### About the end-to-end tests

The 'end-to-end' tests hit an API endpoint that you will spin up on your local machine at `localhost:3000`. The API
builds a Pinecone (serverless) index, seeds it with data, and then queries that index. The end-to-end test ensures
that these basic operations are executable with the given changes in the Typescript client codebase.

The current app only tests _one_ configuration:

- The `Edge` runtime (`^3.0.3`)
- The `NextJS` framework (`@latest`)
- Written in Typescript (`5.3.3`)

- External app: [pinecone-io/pinecone-end-to-end-test](https://github.com/pinecone-io/ts-client-e2e-tests)
- Endpoint the test sends a POST request to:
  - Local runs: localhost:3000/api/createSeedQuery

Once the endpoint is up and running on your `localhost`, use cURL or Postman to send requests, e.g.:

```bash
curl --location --request POST 'http://localhost:3000/api/createSeedQuery' \
--header 'PINECONE_API_KEY: <your api key>'
```
