# Preserving documentation URLs

Documentation builds validate the historical URLs in `docs-url-baseline.json`.
Paths are relative to `https://sdk.pinecone.io/typescript/`. The baseline covers
the landing page, HTML guides, their content anchors, and legacy Markdown
downloads. API reference pages are outside the scope of this check. Theme controls and search IDs are excluded.

The initial published inventory comes from `pinecone-io/sdk-docs` commit
`64de212f45e29171caa0d35cfc4aee68c4fab14f`. That deployment had no `documents/`
directory: its guide links pointed to Markdown in `media/`. The baseline also
includes this repository's current HTML guide output. `docs-legacy-media.json`
keeps the old downloads available by copying their maintained guide sources.
Update that mapping when moving a source file; retain its old destination key.

## Editing guides

Run `npm run docs:build`. A removed page or heading fails the build, even if
nothing in the current documentation links to it. TypeDoc's existing validation
continues to check references in the current sources.

When adding pages or headings, record the new URLs with:

```sh
npm run docs:render
npm run docs:links:update
npm run docs:build
```

Commit the baseline additions with the documentation change. The update command
only adds URLs; it cannot erase historical entries to hide a break. PR builds
also compare the inventory with the immutable PR base commit and reject removed
entries. Once recorded, URLs remain protected even if the corresponding page was
never published. The inventory is conservative by design.

## Moving a page

Add a mapping to `docs-redirects.json`, for example:

```json
{
  "redirects": {
    "documents/data-operations_working-with-vectors.html": "documents/data-operations_vectors.html"
  }
}
```

`typedoc-plugin-redirect` generates the old HTML page. Both paths must be
site-relative HTML paths, without `/typescript/`, query strings, or fragments.
External destinations and parent traversal are rejected. A redirect cannot
overwrite a rendered page, form a cycle, or target a missing page. Prefer direct
redirects to the final destination over chains.

The plugin preserves the incoming fragment in JavaScript. Every historical
fragment must therefore exist on the final destination, and CI checks that it
does. The generated page also has a normal link and a no-JavaScript page redirect;
the automated fragment-preservation test covers the JavaScript path.

## Renaming a heading

Retain the previous ID immediately before the new heading:

```md
<a id="old-heading"></a>

## New heading
```

This also works on the destination of a page redirect. Inspect the generated HTML
or the baseline for the exact old ID rather than guessing TypeDoc's slug rules.

For a page split across several destinations, keep the old guide as a short
compatibility page with its historical anchors and links to the corresponding
new sections. This plugin does not support per-fragment routing: do not put a
fragment in a redirect target, because it appends the incoming fragment. Such
routing would require an additional implementation and tests.

## CI and publishing

The shared build-docs action runs the same tests, rendering, and compatibility
checks for PRs (including docs-only PRs) and publication. PRs fetch the base SHA
to prevent baseline deletions; other builds check the committed inventory.
No live-site crawl or deployment credentials are needed for compatibility checks.

URL existence cannot prove that the destination still explains the same subject.
Review redirect destinations and retained anchors for relevance. Keep historical
URLs and aliases indefinitely; routine baseline refreshes must not remove them.
