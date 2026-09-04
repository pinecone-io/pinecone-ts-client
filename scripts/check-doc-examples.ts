import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export const repoRoot = path.resolve(__dirname, '..');
export const knownFailuresPath = path.join(
  repoRoot,
  'docs-examples',
  'known-failures.json',
);

const TS_CANNOT_FIND_NAME = 2304;
const TS_CANNOT_FIND_NAME_DID_YOU_MEAN = 2552;

export interface CodeBlock {
  sourceFile: string;
  fenceIndex: number;
  startLine: number;
  code: string;
  excludedReason: string | null;
}

export interface KnownFailure {
  file: string;
  fenceIndex: number;
  reason: string;
}

export interface CheckResult {
  checkedCount: number;
  excludedCount: number;
  newFailures: { block: CodeBlock; diagnostics: readonly ts.Diagnostic[] }[];
  stillFailingKnownKeys: Set<string>;
  resolvedKnownFailures: KnownFailure[];
}

export function findMarkdownFiles(root: string): string[] {
  const files = [path.join(root, 'README.md')];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  };
  walk(path.join(root, 'guides'));
  return files;
}

const SUPERSEDED_MIGRATION_GUIDES = new Set([
  'guides/upgrading/v1-migration.md',
  'guides/upgrading/v2-migration.md',
]);

export function classifyExclusion(
  code: string,
  precedingLine: string,
  sourceFile: string,
): string | null {
  if (SUPERSEDED_MIGRATION_GUIDES.has(sourceFile)) {
    return 'migration guide for a version transition since superseded by later majors; not verified against current API';
  }
  if (/PineconeClient/.test(code) && !/\bPinecone\b\s*,/.test(code)) {
    return 'imports the removed pre-v1 PineconeClient class';
  }
  if (/^\*\*Before[:\s]/i.test(precedingLine.trim())) {
    return 'documents a prior major version, marked "**Before"';
  }
  return null;
}

export function extractBlocksFromText(
  relPath: string,
  text: string,
): CodeBlock[] {
  const lines = text.split('\n');
  const blocks: CodeBlock[] = [];
  let fenceIndex = 0;
  let precedingLine = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== '```typescript') {
      if (line.trim() !== '') precedingLine = line;
      continue;
    }
    fenceIndex++;
    const startLine = i + 1;
    const codeLines: string[] = [];
    i++;
    while (i < lines.length && lines[i].trim() !== '```') {
      codeLines.push(lines[i]);
      i++;
    }
    const code = codeLines.join('\n');
    blocks.push({
      sourceFile: relPath,
      fenceIndex,
      startLine,
      code,
      excludedReason: classifyExclusion(code, precedingLine, relPath),
    });
  }
  return blocks;
}

export function extractBlocksFromFile(
  root: string,
  absPath: string,
): CodeBlock[] {
  return extractBlocksFromText(
    path.relative(root, absPath),
    fs.readFileSync(absPath, 'utf8'),
  );
}

function virtualFileName(block: CodeBlock): string {
  return path.join(
    repoRoot,
    `__doc_example__${block.sourceFile}__${block.fenceIndex}.ts`,
  );
}

function createVirtualHost(virtualFiles: Map<string, string>): ts.CompilerHost {
  const realHost = ts.createCompilerHost({}, true);
  return {
    ...realHost,
    fileExists: (fileName) =>
      virtualFiles.has(fileName) || realHost.fileExists(fileName),
    readFile: (fileName) =>
      virtualFiles.get(fileName) ?? realHost.readFile(fileName),
    getSourceFile: (fileName, languageVersion, onError) => {
      const content = virtualFiles.get(fileName);
      return content !== undefined
        ? ts.createSourceFile(fileName, content, languageVersion, true)
        : realHost.getSourceFile(fileName, languageVersion, onError);
    },
  };
}

function compileVirtualFiles(
  virtualFiles: Map<string, string>,
): Map<string, readonly ts.Diagnostic[]> {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: repoRoot,
    paths: {
      '@pinecone-database/pinecone': [path.join(repoRoot, 'src/index.ts')],
    },
  };
  const fileNames = [...virtualFiles.keys()];
  const program = ts.createProgram(
    fileNames,
    options,
    createVirtualHost(virtualFiles),
  );
  const diagnosticsByFile = new Map<string, readonly ts.Diagnostic[]>();
  for (const fileName of fileNames) {
    const sourceFile = program.getSourceFile(fileName);
    diagnosticsByFile.set(
      fileName,
      sourceFile
        ? [
            ...program.getSyntacticDiagnostics(sourceFile),
            ...program.getSemanticDiagnostics(sourceFile),
          ]
        : [],
    );
  }
  return diagnosticsByFile;
}

function undeclaredNamesIn(diagnostics: readonly ts.Diagnostic[]): Set<string> {
  const names = new Set<string>();
  for (const d of diagnostics) {
    if (
      d.code !== TS_CANNOT_FIND_NAME &&
      d.code !== TS_CANNOT_FIND_NAME_DID_YOU_MEAN
    ) {
      continue;
    }
    const match = ts
      .flattenDiagnosticMessageText(d.messageText, ' ')
      .match(/Cannot find name '([^']+)'/);
    if (match) names.add(match[1]);
  }
  return names;
}

const CLIENT_VARIABLE_NAMES = new Set(['pc', 'pinecone']);

function asStandaloneModule(code: string, freeNames: Set<string>): string {
  const sortedNames = [...freeNames].sort();
  const needsClientType = sortedNames.some((name) =>
    CLIENT_VARIABLE_NAMES.has(name),
  );
  const preamble = [
    ...(needsClientType
      ? [
          `import type { Pinecone as __Pinecone } from '@pinecone-database/pinecone';`,
        ]
      : []),
    ...sortedNames.map((name) =>
      CLIENT_VARIABLE_NAMES.has(name)
        ? `declare const ${name}: __Pinecone;`
        : `declare const ${name}: any;`,
    ),
  ];
  const withShims = preamble.length ? `${preamble.join('\n')}\n${code}` : code;
  return `${withShims}\nexport {};\n`;
}

export function keyFor(file: string, fenceIndex: number): string {
  return `${file}#${fenceIndex}`;
}

export function loadKnownFailures(filePath: string): KnownFailure[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function checkBlocks(
  allBlocks: CodeBlock[],
  knownFailures: KnownFailure[],
): CheckResult {
  const checkedBlocks = allBlocks.filter((b) => b.excludedReason === null);

  const unshimmed = new Map<string, string>();
  const nameByFile = new Map<string, CodeBlock>();
  for (const block of checkedBlocks) {
    const fileName = virtualFileName(block);
    unshimmed.set(fileName, `${block.code}\nexport {};\n`);
    nameByFile.set(fileName, block);
  }
  const firstPass = compileVirtualFiles(unshimmed);

  const shimmed = new Map<string, string>();
  for (const [fileName, block] of nameByFile) {
    const freeNames = undeclaredNamesIn(firstPass.get(fileName) ?? []);
    shimmed.set(fileName, asStandaloneModule(block.code, freeNames));
  }
  const secondPass = compileVirtualFiles(shimmed);

  const knownFailureKeys = new Set(
    knownFailures.map((k) => keyFor(k.file, k.fenceIndex)),
  );
  const stillFailingKnownKeys = new Set<string>();
  const newFailures: CheckResult['newFailures'] = [];

  for (const [fileName, block] of nameByFile) {
    const diagnostics = secondPass.get(fileName) ?? [];
    if (diagnostics.length === 0) continue;
    const key = keyFor(block.sourceFile, block.fenceIndex);
    if (knownFailureKeys.has(key)) {
      stillFailingKnownKeys.add(key);
    } else {
      newFailures.push({ block, diagnostics });
    }
  }
  const resolvedKnownFailures = knownFailures.filter(
    (k) => !stillFailingKnownKeys.has(keyFor(k.file, k.fenceIndex)),
  );

  return {
    checkedCount: checkedBlocks.length,
    excludedCount: allBlocks.length - checkedBlocks.length,
    newFailures,
    stillFailingKnownKeys,
    resolvedKnownFailures,
  };
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: () => repoRoot,
    getNewLine: () => '\n',
  });
}

function main() {
  const allBlocks = findMarkdownFiles(repoRoot).flatMap((f) =>
    extractBlocksFromFile(repoRoot, f),
  );
  const result = checkBlocks(allBlocks, loadKnownFailures(knownFailuresPath));
  const relKnownFailuresPath = path.relative(repoRoot, knownFailuresPath);

  console.log(
    `Checked ${result.checkedCount} of ${result.checkedCount + result.excludedCount} ` +
      `documented examples (${result.excludedCount} excluded as historical/legacy).`,
  );
  console.log(
    `${result.stillFailingKnownKeys.size} known failure(s) tracked in ${relKnownFailuresPath}.`,
  );

  let ok = true;

  if (result.newFailures.length > 0) {
    ok = false;
    console.error(
      `\n${result.newFailures.length} example(s) fail to compile:\n`,
    );
    for (const { block, diagnostics } of result.newFailures) {
      console.error(
        `${block.sourceFile}:${block.startLine} (fence #${block.fenceIndex})`,
      );
      console.error(formatDiagnostics(diagnostics));
    }
  }

  if (result.resolvedKnownFailures.length > 0) {
    ok = false;
    console.error(
      `\n${result.resolvedKnownFailures.length} entries in ${relKnownFailuresPath} ` +
        `now compile cleanly and must be removed:\n`,
    );
    for (const k of result.resolvedKnownFailures) {
      console.error(`  ${k.file}#${k.fenceIndex} (${k.reason})`);
    }
  }

  if (ok) console.log('\nAll checked examples compile.');
  process.exit(ok ? 0 : 1);
}

if (require.main === module) main();
