/**
 * Loads `dist/index.js` and constructs a client inside an `EdgeVM` sandbox:
 * no Node built-ins, no `process`/`Buffer`, and a `require` that resolves
 * only relative files under `dist/`. A bare specifier like 'fs' fails here
 * exactly as it would on Vercel Edge or Cloudflare Workers.
 *
 * The Jest `edge` environment cannot catch this: it patches globals but
 * still loads modules through Node, so `require('fs')` succeeds (#54).
 */
import fs from 'fs';
import path from 'path';
import { EdgeVM } from '@edge-runtime/vm';

const PACKAGE_ROOT = path.join(__dirname, '..', '..');
const PACKAGE_JSON = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8'),
) as { main: string };
const ENTRY = path.join(PACKAGE_ROOT, PACKAGE_JSON.main);
const DIST_DIR = path.dirname(ENTRY);

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(ENTRY)) {
  fail(`${ENTRY} does not exist -- run \`npm run build\` first.`);
}

const vm = new EdgeVM();

type CjsModule = { exports: Record<string, unknown> };
const moduleCache = new Map<string, CjsModule>();

function resolveFile(fromDir: string, specifier: string): string {
  const resolved = path.resolve(fromDir, specifier);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }
  if (fs.existsSync(`${resolved}.js`)) {
    return `${resolved}.js`;
  }
  return path.join(resolved, 'index.js');
}

function makeRequire(fromFile: string) {
  return function sandboxedRequire(specifier: string): unknown {
    if (!specifier.startsWith('.')) {
      throw new Error(
        `'${path.relative(DIST_DIR, fromFile)}' requires '${specifier}', which an ` +
          `Edge/Workers runtime cannot resolve (only relative imports inside dist/ are allowed).`,
      );
    }

    const resolved = resolveFile(path.dirname(fromFile), specifier);
    const cached = moduleCache.get(resolved);
    if (cached) {
      return cached.exports;
    }

    if (resolved.endsWith('.json')) {
      const mod: CjsModule = {
        exports: JSON.parse(fs.readFileSync(resolved, 'utf-8')),
      };
      moduleCache.set(resolved, mod);
      return mod.exports;
    }

    const source = fs.readFileSync(resolved, 'utf-8');
    const mod: CjsModule = { exports: {} };
    moduleCache.set(resolved, mod);

    const wrapperSource = `(function (module, exports, require, __filename, __dirname) {\n${source}\n});`;
    const factory =
      vm.evaluate<
        (
          module: CjsModule,
          exports: Record<string, unknown>,
          require: (specifier: string) => unknown,
          filename: string,
          dirname: string,
        ) => void
      >(wrapperSource);
    factory.call(
      mod.exports,
      mod,
      mod.exports,
      makeRequire(resolved),
      resolved,
      path.dirname(resolved),
    );
    return mod.exports;
  };
}

let entryExports: Record<string, unknown>;
try {
  entryExports = makeRequire(path.join(DIST_DIR, '<entry>'))(
    `./${path.basename(ENTRY)}`,
  ) as Record<string, unknown>;
} catch (err) {
  fail(
    `${path.relative(PACKAGE_ROOT, ENTRY)} did not load under a real Edge runtime sandbox: ${(err as Error).message}`,
  );
}

const ENTRY_LABEL = path.relative(PACKAGE_ROOT, ENTRY);
const PineconeCtor = entryExports.Pinecone;
if (typeof PineconeCtor !== 'function') {
  fail(`${ENTRY_LABEL} loaded but did not export a Pinecone constructor.`);
}

try {
  const client = new (PineconeCtor as new (config: unknown) => unknown)({
    apiKey: 'edge-runtime-smoke-test-key',
  });
  if (!client) {
    throw new Error('constructor returned a falsy value');
  }
} catch (err) {
  fail(
    `Constructing \`new Pinecone(...)\` failed under a real Edge runtime sandbox: ${(err as Error).message}`,
  );
}

console.log(
  `PASS: ${ENTRY_LABEL} loads and \`new Pinecone(...)\` constructs under a real Edge runtime sandbox.`,
);
