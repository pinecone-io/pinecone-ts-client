/**
 * The published entry point must not require Node built-ins (`fs`, `path`,
 * `stream`, ...) at import time, or it fails to load in runtimes that don't
 * provide them (Vercel Edge, Cloudflare Workers). Node-only capabilities
 * (file upload from a path, chat streaming) should only pull in their
 * built-ins when a caller actually reaches for them.
 *
 * This spawns a plain `node` process — not Jest's own module loader, which
 * does not go through `Module.prototype.require` the same way — and has it
 * load the built CommonJS entry (`dist/index.js`, produced by
 * `npm run build`) while recording every top-level `require()` of a Node
 * built-in module.
 */
import { execFileSync } from 'child_process';
import path from 'path';

const DIST_ENTRY = path.join(__dirname, '..', '..', 'dist', 'index.js');

const PROBE = `
const Module = require('module');
const builtins = new Set(Module.builtinModules);
const seen = new Set();
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (builtins.has(id.replace(/^node:/, ''))) {
    seen.add(id);
  }
  return originalRequire.apply(this, arguments);
};
require(process.argv[1]);
Module.prototype.require = originalRequire;
process.stdout.write(JSON.stringify([...seen]));
`;

describe('published entry point', () => {
  test('does not require Node built-ins at import time', () => {
    const output = execFileSync('node', ['-e', PROBE, DIST_ENTRY], {
      encoding: 'utf-8',
    });
    expect(JSON.parse(output)).toEqual([]);
  });
});
