import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse } from 'parse5';

export const baselinePath = 'assets/docs-url-baseline.json';

// URLs are relative to the published /typescript/ directory, never the host root.
function pagePath(value) {
  if (
    typeof value !== 'string' ||
    !/^(?:[\w.-]+\/)*[\w.-]+\.html$/.test(value) ||
    value.split('/').some((part) => part === '.' || part === '..')
  ) {
    throw new Error(
      `Expected a site-relative HTML path without a fragment: ${value}`,
    );
  }
}

export function validateRedirects(redirects, pages = []) {
  if (!redirects || typeof redirects !== 'object' || Array.isArray(redirects)) {
    throw new Error('redirects must be an object');
  }
  for (const [from, to] of Object.entries(redirects)) {
    pagePath(from);
    pagePath(to);
    if (pages.includes(from))
      throw new Error(`Redirect would overwrite a rendered page: ${from}`);
    const seen = new Set([from]);
    let next = to;
    while (Object.hasOwn(redirects, next)) {
      if (seen.has(next)) throw new Error(`Redirect cycle at ${from}`);
      seen.add(next);
      next = redirects[next];
    }
  }
}

export function anchors(html, contentOnly = false) {
  const result = new Set();
  function visit(node, inContent = !contentOnly) {
    const attrs = Object.fromEntries(
      (node.attrs ?? []).map(({ name, value }) => [name, value]),
    );
    inContent ||= (attrs.class ?? '').split(/\s+/).includes('tsd-typography');
    if (inContent) {
      if (attrs.id) result.add(attrs.id);
      if (node.tagName === 'a' && attrs.name) result.add(attrs.name);
    }
    for (const child of node.childNodes ?? []) visit(child, inContent);
  }
  visit(parse(html));
  return result;
}

/** Snapshot content permalinks, excluding TypeDoc's search/menu/theme IDs. */
export function inventory(directory) {
  const urls = new Set();
  function scan(relative) {
    const absolute = join(directory, relative);
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const file = `${relative}${entry.name}`;
      if (entry.isDirectory()) scan(`${file}/`);
      else if (file.endsWith('.html')) addPage(file);
      else if (file.startsWith('media/') && file.endsWith('.md'))
        urls.add(file);
    }
  }
  function addPage(file) {
    urls.add(file);
    for (const id of anchors(
      readFileSync(join(directory, file), 'utf8'),
      true,
    )) {
      urls.add(`${file}#${encodeURIComponent(id)}`);
    }
  }
  addPage('index.html');
  scan('documents/');
  scan('media/');
  return [...urls].sort();
}

export function readBaseline(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (
    data.version !== 1 ||
    !Array.isArray(data.urls) ||
    !data.urls.length ||
    data.urls.some((url) => typeof url !== 'string')
  ) {
    throw new Error(`Invalid URL baseline: ${file}`);
  }
  return data;
}

export function checkLinks(directory, urls, redirects) {
  validateRedirects(redirects);
  const errors = [];
  const cache = new Map();
  // Check even redirects that are not (yet) part of the historical inventory.
  for (const url of new Set([...urls, ...Object.keys(redirects)])) {
    const [original, fragment, extra] = url.split('#');
    if (
      !/^(?:[\w.-]+\/)*[\w.-]+\.(?:html|md)$/.test(original) ||
      original.split('/').some((part) => part === '.' || part === '..') ||
      extra !== undefined
    ) {
      errors.push(`Invalid baseline URL: ${url}`);
      continue;
    }
    let page = original;
    while (Object.hasOwn(redirects, page)) {
      if (!existsSync(join(directory, page)))
        errors.push(`Missing redirect page: ${page}`);
      page = redirects[page];
    }
    const file = join(directory, page);
    if (!existsSync(file)) {
      errors.push(`${url} -> missing page ${page}`);
    } else if (fragment) {
      if (!cache.has(page))
        cache.set(page, anchors(readFileSync(file, 'utf8')));
      let id;
      try {
        id = decodeURIComponent(fragment);
      } catch {
        id = fragment;
      }
      if (!cache.get(page).has(id))
        errors.push(`${url} -> missing anchor ${page}#${fragment}`);
    }
  }
  return errors;
}

export function removedUrls(previous, current) {
  const present = new Set(current);
  return previous.filter((url) => !present.has(url));
}

function main() {
  const [command = 'check', directory = 'docs'] = process.argv.slice(2);
  const baseline = readBaseline(baselinePath);
  const redirects = JSON.parse(
    readFileSync('assets/docs-redirects.json', 'utf8'),
  ).redirects;
  if (command === 'update') {
    // Additive only: never make a break pass by refreshing away old URLs.
    baseline.urls = [
      ...new Set([...baseline.urls, ...inventory(directory)]),
    ].sort();
    writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(
      `Recorded ${baseline.urls.length} historical documentation URLs.`,
    );
    return;
  }
  if (command !== 'check') throw new Error(`Unknown command: ${command}`);
  const errors = checkLinks(directory, baseline.urls, redirects);
  for (const url of removedUrls(inventory(directory), baseline.urls)) {
    errors.push(
      `New URL is not baselined: ${url} (run npm run docs:links:update)`,
    );
  }
  // CI fetches the immutable PR base commit. Bootstrap only when the file truly
  // did not exist there; a failed git lookup must never silently skip the check.
  const base = process.env.DOCS_BASE_REF;
  if (base) {
    const files = execFileSync(
      'git',
      ['ls-tree', '--name-only', base, '--', baselinePath],
      { encoding: 'utf8' },
    );
    if (files.trim()) {
      const previous = JSON.parse(
        execFileSync('git', ['show', `${base}:${baselinePath}`], {
          encoding: 'utf8',
        }),
      );
      for (const url of removedUrls(previous.urls, baseline.urls))
        errors.push(`Historical URL removed from baseline: ${url}`);
    }
  }
  if (errors.length)
    throw new Error(
      `Documentation URL compatibility failed:\n${errors.join('\n')}`,
    );
  console.log(
    `Verified ${baseline.urls.length} historical documentation URLs.`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
