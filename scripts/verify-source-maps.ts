// Verifies that every emitted dist/**/*.js.map and dist/**/*.d.ts.map embeds
// its original source text via `sourcesContent`. Only `dist/` is published
// (see package.json "files"), so a map that merely points at `../src/*.ts`
// is unresolvable for a consumer and worse than no map at all.
//
// Usage: npm run build && npx tsx scripts/verify-source-maps.ts
import * as fs from 'fs';
import * as path from 'path';

const distDir = path.resolve(__dirname, '../dist');
const FIX_HINT =
  'ensure tsconfig has "inlineSources": true (and "sourceMap"/"declarationMap" as applicable), then rerun "npm run build"';

function findMaps(dir: string, suffix: string): string[] {
  let maps: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      maps = maps.concat(findMaps(full, suffix));
    } else if (entry.name.endsWith(suffix)) {
      maps.push(full);
    }
  }
  return maps;
}

if (!fs.existsSync(distDir)) {
  console.error(`${distDir} does not exist. Run "npm run build" first.`);
  process.exit(1);
}

const maps = [
  ...findMaps(distDir, '.js.map'),
  ...findMaps(distDir, '.d.ts.map'),
];
if (maps.length === 0) {
  console.error(`No .js.map or .d.ts.map files found under ${distDir}.`);
  process.exit(1);
}

let failures = 0;
for (const mapPath of maps) {
  const relPath = path.relative(distDir, mapPath);
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const sourcesContent: unknown[] | undefined = map.sourcesContent;

  if (
    !Array.isArray(sourcesContent) ||
    sourcesContent.length !== map.sources.length
  ) {
    console.error(
      `${relPath}: missing sourcesContent for one or more sources — ${FIX_HINT}`,
    );
    failures++;
    continue;
  }
  if (
    sourcesContent.some(
      (content) => typeof content !== 'string' || content.length === 0,
    )
  ) {
    console.error(
      `${relPath}: sourcesContent has an empty or missing entry — ${FIX_HINT}`,
    );
    failures++;
  }
}

if (failures > 0) {
  console.error(
    `${failures} of ${maps.length} source maps do not embed their sources.`,
  );
  process.exit(1);
}

console.log(`All ${maps.length} source maps embed their sources.`);
