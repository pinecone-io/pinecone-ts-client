import { copyFileSync } from 'fs';
import { join } from 'path';
import { PageEvent, RendererEvent } from 'typedoc';
import { scopeDocumentationWarnings } from './docs-validation.mjs';

/**
 * This script is passed into typedoc at build time, and is used to hook into their rendering
 * pipeline allowing us to modify the output.
 *
 * example: typedoc --plugin ./assets/docs-theme.mjs
 * TypeDoc documentation: https://github.com/TypeStrong/typedoc/blob/master/internal-docs/custom-themes.md#hooks-v0228
 */

export const load = (app) => {
  scopeDocumentationWarnings(app.logger);
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

function onRenderFinished() {
  // rendering complete, copy favicon asset into /docs folder
  if (process) {
    const workingDir = process.cwd();
    const startingFavIcon = join(workingDir, '/assets/favicon-32x32.png');
    const endingFavIcon = join(workingDir, './docs', '/favicon-32x32.png');

    copyFileSync(startingFavIcon, endingFavIcon);
  }
}
