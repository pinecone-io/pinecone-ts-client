import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { load as loadRedirectPlugin } from 'typedoc-plugin-redirect';
import {
  anchors,
  checkLinks,
  inventory,
  removedUrls,
  validateRedirects,
} from './docs-links.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'docs-links-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return {
    directory,
    write(file, content) {
      mkdirSync(dirname(join(directory, file)), { recursive: true });
      writeFileSync(join(directory, file), content);
    },
  };
}

test('CLI rejects baseline deletions against the PR base and adds new URLs without dropping old ones', (t) => {
  const { directory, write } = fixture(t);
  const baseline = (urls) => JSON.stringify({ version: 1, urls });
  write(
    'assets/docs-url-baseline.json',
    baseline(['index.html', 'index.html#old']),
  );
  write('assets/docs-redirects.json', '{"redirects":{}}');
  write(
    'docs/index.html',
    '<div class="tsd-typography"><a id="old"></a><h2 id="new">New</h2></div>',
  );
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  git('init');
  git('add', 'assets/docs-url-baseline.json');
  git(
    '-c',
    'user.name=Docs test',
    '-c',
    'user.email=docs@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-m',
    'Baseline',
  );
  const base = git('rev-parse', 'HEAD').trim();
  const cli = (command, ref = base) =>
    spawnSync(
      process.execPath,
      [fileURLToPath(new URL('./docs-links.mjs', import.meta.url)), command],
      {
        cwd: directory,
        encoding: 'utf8',
        env: { ...process.env, DOCS_BASE_REF: ref },
      },
    );
  assert.match(cli('check').stderr, /New URL is not baselined/);
  assert.equal(cli('update').status, 0);
  assert.equal(cli('check').status, 0);
  write(
    'assets/docs-url-baseline.json',
    baseline(['index.html', 'index.html#new']),
  );
  assert.match(
    cli('check').stderr,
    /Historical URL removed from baseline: index.html#old/,
  );
  write(
    'docs/index.html',
    '<div class="tsd-typography"><h2 id="new">New</h2></div>',
  );
  // Removing the anchor too must not bypass base-branch retention.
  assert.match(cli('check').stderr, /Historical URL removed from baseline/);
  assert.notEqual(cli('check', 'nonexistent-ref').status, 0);
});

test('inventory records page URLs and content anchors, including aliases, but not theme IDs', (t) => {
  const { directory, write } = fixture(t);
  write(
    'index.html',
    '<div id="search"></div><div class="tsd-typography"><h1 id="hello">Hello</h1><a name="old"></a><h2 id="a&amp;b">Entity</h2></div>',
  );
  write(
    'documents/nested/guide.html',
    '<div class="tsd-typography"><h2 id="section">Section</h2></div>',
  );
  write('media/guide.md', '# Guide');
  write(
    'classes/Client.html',
    '<h1 id="reference">API policy is separate</h1>',
  );
  assert.deepEqual(inventory(directory), [
    'documents/nested/guide.html',
    'documents/nested/guide.html#section',
    'index.html',
    'index.html#a%26b',
    'index.html#hello',
    'index.html#old',
    'media/guide.md',
  ]);
});

test('renaming pages and headings fails even with no incoming links in the current site', (t) => {
  const { directory, write } = fixture(t);
  write('index.html', '<h2 id="new">New</h2>');
  assert.deepEqual(
    checkLinks(directory, ['documents/old.html', 'index.html#old'], {}),
    [
      'documents/old.html -> missing page documents/old.html',
      'index.html#old -> missing anchor index.html#old',
    ],
  );
});

test('explicit anchor aliases and escaped Unicode anchors resolve', (t) => {
  const { directory, write } = fixture(t);
  write(
    'index.html',
    '<a id="old"></a><h2 id="new">New</h2><a id="café&amp;tea"></a>',
  );
  assert.deepEqual(
    checkLinks(directory, ['index.html#old', 'index.html#caf%C3%A9%26tea'], {}),
    [],
  );
  assert.ok(anchors('<a name="legacy"></a>').has('legacy'));
});

test('rejects cycles, output collisions, escaping paths and fragment destinations', () => {
  for (const redirects of [
    { 'a.html': 'a.html' },
    { 'a.html': 'b.html', 'b.html': 'a.html' },
    { '../a.html': 'b.html' },
    { 'a.html': '../b.html' },
    { '/a.html': 'b.html' },
    { 'a.html': 'https://example.com' },
    { 'a.html': 'b.html#section' },
    { 'a.html': 'b.html?query=1' },
    { 'a.html': 'a/../../b.html' },
    { 'a.html': 'a\\b.html' },
  ])
    assert.throws(() => validateRedirects(redirects));
  assert.throws(
    () => validateRedirects({ 'a.html': 'b.html' }, ['a.html']),
    /overwrite/,
  );
});

test('checks redirect destinations and inherited fragments, including chains', (t) => {
  const { directory, write } = fixture(t);
  write('old.html', 'redirect');
  write('middle.html', 'redirect');
  write('new.html', '<h2 id="retained">Section</h2>');
  const redirects = { 'old.html': 'middle.html', 'middle.html': 'new.html' };
  assert.deepEqual(checkLinks(directory, ['old.html#retained'], redirects), []);
  assert.match(
    checkLinks(directory, ['old.html#removed'], redirects)[0],
    /missing anchor new.html#removed/,
  );
  assert.ok(
    checkLinks(directory, [], { 'old.html': 'missing.html' }).some((e) =>
      e.includes('missing page'),
    ),
  );
  assert.ok(
    checkLinks(directory, [], { 'absent.html': 'new.html' }).some((e) =>
      e.includes('Missing redirect page'),
    ),
  );
});

test('baseline retention detects removal even when the new site no longer links there', () => {
  assert.deepEqual(
    removedUrls(['index.html', 'old.html#section'], ['index.html', 'new.html']),
    ['old.html#section'],
  );
});

test('installed redirect plugin emits working relative redirects preserving fragments under /typescript/', (t) => {
  const { directory, write } = fixture(t);
  const redirects = { 'documents/old.html': 'documents/nested/new.html' };
  write('documents/nested/new.html', '<h2 id="section">Section</h2>');
  let renderEnd;
  loadRedirectPlugin({
    options: {
      addDeclaration() {},
      getValue() {
        return redirects;
      },
    },
    renderer: {
      on(_event, callback) {
        renderEnd = callback;
      },
    },
    logger: {
      warn(message) {
        assert.fail(message);
      },
    },
  });
  renderEnd({ outputDirectory: directory });
  const html = readFileSync(join(directory, 'documents/old.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  let destination;
  runInNewContext(script, {
    location: {
      hash: '#section',
      replace(url) {
        destination = url;
      },
    },
  });
  assert.equal(
    new URL(
      destination,
      'https://sdk.pinecone.io/typescript/documents/old.html',
    ).href,
    'https://sdk.pinecone.io/typescript/documents/nested/new.html#section',
  );
  assert.match(html, /<noscript>/);
  assert.match(html, /<a href="nested\/new.html">/);
  assert.deepEqual(
    checkLinks(directory, ['documents/old.html#section'], redirects),
    [],
  );
});
