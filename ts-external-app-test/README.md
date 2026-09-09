# External app tests

The test(s) in this directory test the initialization and some basic functionality of our client, as used in an
external app. The goal of this type of testing is to ensure that the Typescript client can be used in real-world
scenarios that have been incompatible with our client in the past, such as Vercel apps running on Edge.

These tests differ from integration tests in that they are aimed at testing the client's interaction with various
runtimes and frameworks, rather than the client's interaction with Pinecone's APIs directly.

## Local runs

To run the external app tests locally, execute `npm run test:external-app-local` from the root of this repository.

You will need set a `PINECONE_API_KEY` environment variable for the tests to succeed. Additionally, ensure your local
port `3000` is available, as that is the port the external app will run on.

## Internal release validation

The internal mirror type-checks this runner and the expanded consumer fixtures
against built declarations with `npm run build && npm run typecheck`. The packed
consumer check also compiles those fixtures in Node, DOM, and WebWorker contexts.
These checks run without deploying or calling the external app.

The existing external deployment jobs remain restricted to the public repository.
Updating and validating the separately deployed companion app is a release step
tracked in [#5](https://github.com/pinecone-io/pinecone-ts-client-internal/issues/5).
