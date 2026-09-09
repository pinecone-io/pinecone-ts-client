import { copyFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { PageEvent, RendererEvent } from 'typedoc';
import { scopeDocumentationWarnings } from './docs-validation.mjs';
import { validateRedirects } from './docs-links.mjs';

/**
 * This script is passed into typedoc at build time, and is used to hook into their rendering
 * pipeline allowing us to modify the output.
 *
 * example: npm run docs:render (plugins are configured in typedoc.json)
 * TypeDoc documentation: https://github.com/TypeStrong/typedoc/blob/master/internal-docs/custom-themes.md#hooks-v0228
 */

export const load = (app) => {
  scopeDocumentationWarnings(app.logger);
  app.renderer.on(RendererEvent.BEGIN, (event) => {
    // Fail before the redirect plugin can overwrite a real page or write paths
    // outside the output directory. Its built-in collision check only warns.
    validateRedirects(
      app.options.getValue('redirects'),
      event.pages.map((page) => page.url),
    );
  });
  app.renderer.on(PageEvent.END, onPageRendered);
  app.renderer.on(RendererEvent.END, onRenderFinished);
};

function onPageRendered(page) {
  // after the page is rendered we want to insert a favicon into head. The favicon
  // lives at the root of the output, so the href has to be relative to the page's
  // own depth -- typedoc has already worked that out and emitted it as `data-base`.
  if (page && page.contents) {
    const base = page.contents.match(/data-base="([^"]*)"/)?.[1] ?? './';
    page.contents = page.contents.replace(
      '</head>',
      `<link rel="icon" href="${base}favicon-32x32.png"/></head>`,
    );
  }
}

function onRenderFinished(event) {
  // rendering complete, copy favicon asset into /docs folder
  if (process) {
    const workingDir = process.cwd();
    const startingFavIcon = join(workingDir, '/assets/favicon-32x32.png');
    const endingFavIcon = join(event.outputDirectory, 'favicon-32x32.png');

    copyFileSync(startingFavIcon, endingFavIcon);
    // The previously published site linked to raw Markdown under media/.
    // Keep those downloads available using the maintained guide sources.
    const media = JSON.parse(
      readFileSync(
        new URL('./docs-legacy-media.json', import.meta.url),
        'utf8',
      ),
    );
    for (const [destination, source] of Object.entries(media)) {
      if (
        !/^media\/[\w-]+\.md$/.test(destination) ||
        !/^guides\/(?:[\w-]+\/)*[\w-]+\.md$/.test(source)
      ) {
        throw new Error(
          `Invalid legacy media mapping: ${destination} -> ${source}`,
        );
      }
      const output = join(event.outputDirectory, destination);
      mkdirSync(dirname(output), { recursive: true });
      copyFileSync(join(workingDir, source), output);
    }
  }
}
