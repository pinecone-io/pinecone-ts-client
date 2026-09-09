# Packed SDK runtime compatibility

Run `npm run test:compatibility` from the repository root after `npm ci`.
The runner builds with `npm pack`, installs the tarball into a temporary
directory outside the checkout, and runs both CommonJS and ESM consumers
with the current Node executable. It removes the temporary installation afterward.
To test an existing artifact without rebuilding, run
`node scripts/test-package.mjs /absolute/path/to/package.tgz`.

CI builds one tarball and tests it on Node 22.x and 24.x. These jobs need no
Pinecone credentials and run independently of the live integration setup,
including on Dependabot PRs. The runtime jobs install no repository development
dependencies. Neither Jest nor a TypeScript transpiler transforms the SDK.

Both module formats exercise public named exports, a control-plane request,
assistant uploads from a path, Blob, sliced Buffer/Uint8Array, Node Readable,
and async iterable, and assistant chat streaming. A loopback HTTP server checks
authentication, multipart file names, exact bytes, metadata, and chat request
contents. Requests use the runtime's native fetch. Responses verify SDK decoding,
including date conversion and streamed Unicode. A separate public ChatStream test
guarantees one-byte chunks because TCP may combine the server's writes.

This suite covers the runtime paths changed in PR #154. Consumer TypeScript
versions remain a separate CI matrix; this is not a claim of Bun, Deno, browser,
or Worker support. No requests should leave the local HTTP server.
