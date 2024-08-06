import { copyFileSync } from 'fs';
import { join } from 'path';

/**
 * This script is passed into typedoc at build time, and is used to hook into their rendering
 * pipeline allowing us to modify the output.
 *
 * example: typedoc --plugin ./assets/docs-theme.mjs
 * TypeDoc documentation: https://github.com/TypeStrong/typedoc/blob/master/internal-docs/custom-themes.md#hooks-v0228
 */

export const load = (app) => {
  // See PageEvent: https://github.com/TypeStrong/typedoc/blob/f2d2abe054feca91b89c00c33e1d726bbda85dcb/src/lib/output/events.ts#L134
  app.renderer.on('endPage', onPageRendered.bind(this));
  // See RendererEvent: https://github.com/TypeStrong/typedoc/blob/f2d2abe054feca91b89c00c33e1d726bbda85dcb/src/lib/output/events.ts#L47
  app.renderer.once('endRender', onRenderFinished.bind(this));
};

function onPageRendered(page) {
  // after the page is rendered we want to insert a favicon into head
  if (page && page.contents) {
    page.contents = page.contents.replace(
      '</head>',
      '<link rel="icon" href="./favicon-32x32.png"/></head>',
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
