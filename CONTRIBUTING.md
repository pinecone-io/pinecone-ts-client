# Contributing

We welcome contributions to this project.

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

If you need to regenerate the TypeScript types from the OpenAPI spec (e.g. after a spec update), run:

```bash
npm run generate:openapi
```

This rebuilds the generated code under `src/pinecone-generated-ts-fetch/`, then runs `build` and `format` automatically.

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
