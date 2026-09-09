const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { createServer } = require('node:http');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Readable } = require('node:stream');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');

const content = 'café 🌲\npacked SDK upload';
const apiKey = 'local-consumer-test-key';

exports.consumerTests = ({ Pinecone, Errors, ChatStream }, mode) => {
  test(
    `${mode}: installed package on Node ${process.version}`,
    { timeout: 30_000 },
    async (t) => {
      const directory = await mkdtemp(join(tmpdir(), 'pinecone-upload-'));
      const requests = [];
      const serverErrors = [];
      const server = createServer((req, res) => {
        handle(req, res).catch((error) => {
          serverErrors.push(error);
          res.writeHead(500).end(String(error));
        });
      });
      t.after(async () => {
        try {
          if (server.listening) {
            server.closeAllConnections();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
        } finally {
          await rm(directory, { recursive: true, force: true });
        }
        assert.deepEqual(serverErrors, [], 'local server assertions');
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const host = `http://127.0.0.1:${server.address().port}`;
      const pc = new Pinecone({
        apiKey,
        controllerHostUrl: host,
        maxRetries: 0,
      });
      const assistant = pc.assistant({ name: 'consumer-test', host });

      async function handle(req, res) {
        assert.equal(req.headers['api-key'], apiKey);
        requests.push(`${req.method} ${req.url}`);
        if (req.method === 'GET' && req.url === '/indexes') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ indexes: [] }));
          return;
        }
        const bytes = [];
        for await (const chunk of req) bytes.push(chunk);
        const body = Buffer.concat(bytes);
        if (req.method === 'POST' && req.url === '/files/consumer-test') {
          const form = await new Response(body, {
            headers: { 'Content-Type': req.headers['content-type'] },
          }).formData();
          const file = form.get('file');
          assert.equal(file.name, 'upload with spaces.txt');
          assert.deepEqual(
            Buffer.from(await file.arrayBuffer()),
            Buffer.from(content),
          );
          const metadata = form.get('metadata');
          assert.deepEqual(
            JSON.parse(
              typeof metadata === 'string' ? metadata : await metadata.text(),
            ),
            { source: 'consumer' },
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              id: 'operation-1',
              operation_type: 'upload',
              status: 'Completed',
              created_on: '2026-01-01T00:00:00Z',
              file_id: 'file-1',
            }),
          );
          return;
        }
        if (req.method === 'POST' && req.url === '/chat/consumer-test') {
          const payload = JSON.parse(body.toString());
          assert.equal(payload.stream, true);
          assert.deepEqual(payload.messages, [
            { role: 'user', content: 'Hello' },
          ]);
          res.writeHead(200, { 'Content-Type': 'text/event-stream' });
          const event = Buffer.from(
            'data: {"chunk_type":"content","content":"café 🌲"}\n\n',
          );
          // Split both UTF-8 characters across writes. TCP may coalesce writes,
          // so the separate ChatStream case below guarantees byte boundaries too.
          const split = event.indexOf(Buffer.from('é')) + 1;
          const treeSplit = event.indexOf(Buffer.from('🌲')) + 2;
          res.write(event.subarray(0, split));
          await delay(10);
          res.write(event.subarray(split, treeSplit));
          await delay(10);
          res.end(event.subarray(treeSplit));
          return;
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      }

      await t.test('public exports and native fetch request', async () => {
        assert.equal(typeof Errors.PineconeBadRequestError, 'function');
        assert.ok(new Errors.PineconeBadRequestError('test') instanceof Error);
        assert.deepEqual(await pc.indexes.list(), { indexes: [] });
      });

      const path = join(directory, 'upload with spaces.txt');
      await writeFile(path, content);
      const padded = Buffer.from(`prefix${content}suffix`);
      const view = padded.subarray(6, padded.length - 6);
      async function* chunks() {
        yield 'café ';
        yield new TextEncoder().encode('🌲\npacked SDK upload');
      }
      const uploads = [
        ['file path (dynamic fs/path imports)', () => ({ path })],
        ['Blob', () => ({ file: new Blob([content]) })],
        ['sliced Buffer', () => ({ file: view })],
        [
          'sliced Uint8Array',
          () => ({
            file: new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
          }),
        ],
        [
          'Node Readable with string and byte chunks',
          () => ({ file: Readable.from(chunks()) }),
        ],
        [
          'async iterable with string and byte chunks',
          () => ({ file: chunks() }),
        ],
      ];
      for (const [name, input] of uploads) {
        await t.test(`multipart upload: ${name}`, async () => {
          const before = requests.length;
          const result = await assistant.uploadFile({
            fileName: 'upload with spaces.txt',
            metadata: { source: 'consumer' },
            ...input(),
          });
          assert.equal(requests.length, before + 1);
          assert.equal(result.id, 'operation-1');
          assert.equal(result.fileId, 'file-1');
          assert.equal(result.operationType, 'upload');
          assert.equal(
            result.createdOn.toISOString(),
            '2026-01-01T00:00:00.000Z',
          );
        });
      }
      await t.test(
        'chat response through native fetch and Node stream conversion',
        async () => {
          const stream = await assistant.chatStream({
            messages: [{ role: 'user', content: 'Hello' }],
          });
          const result = [];
          for await (const chunk of stream) result.push(chunk);
          assert.deepEqual(result, [
            { chunkType: 'content', content: 'café 🌲' },
          ]);
        },
      );
      await t.test(
        'ChatStream decodes UTF-8 split into individual bytes',
        async () => {
          async function* bytes() {
            for (const byte of new TextEncoder().encode(
              'data: {"content":"café 🌲"}\n',
            ))
              yield new Uint8Array([byte]);
          }
          const result = [];
          for await (const chunk of new ChatStream(bytes())) result.push(chunk);
          assert.deepEqual(result, [{ content: 'café 🌲' }]);
        },
      );
      assert.equal(
        requests.length,
        8,
        'all expected requests reached the local server',
      );
    },
  );
};
