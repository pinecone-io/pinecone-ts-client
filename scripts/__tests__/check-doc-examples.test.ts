import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  classifyExclusion,
  extractTSDocBlocks,
  findTypeScriptFiles,
  extractBlocksFromText,
  checkBlocks,
  codeHash,
} from '../check-doc-examples';

describe('extractBlocksFromText', () => {
  test('extracts fenced typescript blocks with 1-based fence index and start line', () => {
    const text = [
      '# Title',
      '',
      '```typescript',
      'const a = 1;',
      '```',
      '',
      'some prose',
      '',
      '```typescript',
      'const b = 2;',
      '```',
    ].join('\n');

    const blocks = extractBlocksFromText('doc.md', text);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      fenceIndex: 1,
      startLine: 3,
      code: 'const a = 1;',
    });
    expect(blocks[1]).toMatchObject({
      fenceIndex: 2,
      startLine: 9,
      code: 'const b = 2;',
    });
  });

  test('ignores non-typescript fences', () => {
    const text = ['```bash', 'npm install', '```'].join('\n');
    expect(extractBlocksFromText('doc.md', text)).toHaveLength(0);
  });
});

describe('classifyExclusion', () => {
  test('excludes a block importing the removed PineconeClient class', () => {
    const code =
      "import { PineconeClient } from '@pinecone-database/pinecone';";
    expect(classifyExclusion(code, '', 'guides/x.md')).toMatch(
      /PineconeClient/,
    );
  });

  test('does not exclude a block importing Pinecone alongside another named export', () => {
    const code =
      "import { Pinecone, PineconeConflictError } from '@pinecone-database/pinecone';";
    expect(classifyExclusion(code, '', 'guides/x.md')).toBeNull();
  });

  test('excludes a block whose nearest preceding line is a "**Before" heading', () => {
    const code = 'const x = 1;';
    expect(
      classifyExclusion(code, '**Before: <= 7.x**', 'guides/x.md'),
    ).toMatch(/Before/);
  });

  test('excludes anything in a superseded migration guide', () => {
    expect(
      classifyExclusion('const x = 1;', '', 'guides/upgrading/v1-migration.md'),
    ).toMatch(/superseded/);
  });

  test('checks an ordinary block', () => {
    expect(
      classifyExclusion('const x = 1;', 'some prose', 'guides/x.md'),
    ).toBeNull();
  });
});

describe('checkBlocks', () => {
  const block = (
    overrides: Partial<Parameters<typeof checkBlocks>[0][number]>,
  ) => ({
    sourceFile: 'doc.md',
    fenceIndex: 1,
    startLine: 1,
    code: '',
    excludedReason: null,
    ...overrides,
  });

  test('a self-contained example against the real SDK compiles clean', () => {
    const result = checkBlocks(
      [
        block({
          code: [
            "import { Pinecone } from '@pinecone-database/pinecone';",
            "const pc = new Pinecone({ apiKey: 'x' });",
            'void pc;',
          ].join('\n'),
        }),
      ],
      [],
    );
    expect(result.newFailures).toHaveLength(0);
  });

  test('an example with a genuine type error is a new failure', () => {
    const result = checkBlocks(
      [
        block({
          code: [
            "import { Pinecone } from '@pinecone-database/pinecone';",
            "const pc = new Pinecone({ apiKey: 'x' });",
            'const n: number = pc;',
          ].join('\n'),
        }),
      ],
      [],
    );
    expect(result.newFailures).toHaveLength(1);
    expect(result.newFailures[0].block.sourceFile).toBe('doc.md');
  });

  test('a free client variable is shimmed with the real Pinecone type, not any', () => {
    const result = checkBlocks(
      [
        block({
          fenceIndex: 2,
          code: 'const indexModel = await pc.createIndex({ name: "x", dimension: 8 });\nconst host = indexModel.host;',
        }),
      ],
      [],
    );
    expect(result.newFailures).toHaveLength(1);
  });

  test('a failure listed in the known-failures baseline is suppressed', () => {
    const code = [
      "import { Pinecone } from '@pinecone-database/pinecone';",
      "const pc = new Pinecone({ apiKey: 'x' });",
      'const n: number = pc;',
    ].join('\n');
    const result = checkBlocks(
      [block({ code })],
      [
        {
          file: 'doc.md',
          codeHash: codeHash(code),
          reason: 'tracked elsewhere',
        },
      ],
    );
    expect(result.newFailures).toHaveLength(0);
    expect(result.stillFailingKnownKeys.has(`doc.md#${codeHash(code)}`)).toBe(
      true,
    );
    expect(result.resolvedKnownFailures).toHaveLength(0);
    expect(result.unmatchedKnownFailures).toHaveLength(0);
  });

  test('a baseline entry whose example now compiles is flagged for removal', () => {
    const code = [
      "import { Pinecone } from '@pinecone-database/pinecone';",
      "const pc = new Pinecone({ apiKey: 'x' });",
      'void pc;',
    ].join('\n');
    const entry = {
      file: 'doc.md',
      codeHash: codeHash(code),
      reason: 'used to fail',
    };
    const result = checkBlocks([block({ code })], [entry]);
    expect(result.resolvedKnownFailures).toEqual([entry]);
    expect(result.unmatchedKnownFailures).toHaveLength(0);
  });

  test('a baseline entry matching no checked example is unmatched, not "resolved"', () => {
    const entry = {
      file: 'doc.md',
      codeHash: 'does-not-exist',
      reason: 'stale after an edit',
    };
    const result = checkBlocks(
      [
        block({
          code: "import { Pinecone } from '@pinecone-database/pinecone';",
        }),
      ],
      [entry],
    );
    expect(result.resolvedKnownFailures).toHaveLength(0);
    expect(result.unmatchedKnownFailures).toEqual([entry]);
  });

  test('excluded blocks are never checked', () => {
    const result = checkBlocks(
      [
        block({
          code: 'this is not valid typescript {{{',
          excludedReason: 'legacy',
        }),
      ],
      [],
    );
    expect(result.checkedCount).toBe(0);
    expect(result.excludedCount).toBe(1);
    expect(result.newFailures).toHaveLength(0);
  });
});

it('preserves precise index creation return types across both public entry points', () => {
  const code = `
import { Pinecone, IndexModel, CreateIndexOptions, CreateIndexForModelOptions } from '@pinecone-database/pinecone';
const pc = new Pinecone({ apiKey: 'test-key' });
declare const dynamic: boolean;
declare const genericOptions: CreateIndexOptions;
declare const genericModelOptions: CreateIndexForModelOptions;
${[
  'pc.createIndex',
  'pc.indexes.create',
  'pc.createIndexForModel',
  'pc.indexes.createForModel',
]
  .map((method) => {
    const model = /[Ff]orModel/.test(method);
    const options = model
      ? "name: 'test', cloud: 'aws', region: 'us-east-1', embed: { model: 'test-model', fieldMap: { text: 'text' } }"
      : "name: 'test', schema: { fields: { vector: { type: 'dense_vector', dimension: 8, metric: 'cosine' } } }";
    return `
{
  const ordinary: IndexModel = await ${method}({ ${options} });
  const waiting: IndexModel = await ${method}({ ${options}, waitUntilReady: true });
  const immediate: IndexModel = await ${method}({ ${options}, waitUntilReady: false });
  const explicit: IndexModel = await ${method}({ ${options}, suppressConflicts: false });
  const optional: IndexModel | void = await ${method}({ ${options}, suppressConflicts: true });
  // @ts-expect-error A suppressed conflict may return undefined, even when waiting.
  const suppressed: IndexModel = await ${method}({ ${options}, suppressConflicts: true, waitUntilReady: true });
  // @ts-expect-error A dynamic suppression flag may return undefined.
  const unknown: IndexModel = await ${method}({ ${options}, suppressConflicts: dynamic });
  // @ts-expect-error Broadly typed options may suppress conflicts.
  const generic: IndexModel = await ${method}(${model ? 'genericModelOptions' : 'genericOptions'});
}`;
  })
  .join('\n')}`;
  const result = checkBlocks(
    extractBlocksFromText(
      'return-types.md',
      '```typescript\n' + code + '\n```',
    ),
    [],
  );
  expect(result.newFailures).toEqual([]);
  expect(result.anyShimmedNames.size).toBe(0);
});

describe('TSDoc examples', () => {
  const comment = (code: string) =>
    [
      '/**',
      ' * @example',
      ' * ```typescript',
      ...code.split('\n').map((line) => ` * ${line}`),
      ' * ```',
      ' */',
      'export function example() {}',
    ].join('\n');

  it('extracts multiple examples across nested declarations with original fence lines', () => {
    const text = [
      'export class Examples {',
      '  /**',
      '   * @example First example',
      '   * ```typescript',
      '   * const first = 1;',
      '   * ```',
      '   * @example Second example',
      '   * ```typescript',
      '   * const second = 2;',
      '   * ```',
      '   * @returns Not an example',
      '   * ```typescript',
      '   * const ignored = 3;',
      '   * ```',
      '   */',
      '  method() {}',
      '}',
      comment('const third = 3;'),
    ].join('\n');
    expect(extractTSDocBlocks('src/example.ts', text)).toEqual([
      {
        sourceFile: 'src/example.ts',
        fenceIndex: 1,
        startLine: 4,
        code: 'const first = 1;',
        excludedReason: null,
      },
      {
        sourceFile: 'src/example.ts',
        fenceIndex: 2,
        startLine: 8,
        code: 'const second = 2;',
        excludedReason: null,
      },
      {
        sourceFile: 'src/example.ts',
        fenceIndex: 3,
        startLine: 20,
        code: 'const third = 3;',
        excludedReason: null,
      },
    ]);
  });

  it('ignores comment-like strings, ordinary comments, and fences outside @example tags', () => {
    const text = [
      `const fake = ${JSON.stringify(comment('const ignored = 1;'))};`,
      comment('const ignored = 2;').replace('/**', '/*'),
      comment('const ignored = 3;').replace('@example', '@remarks'),
      comment('npm install').replace('```typescript', '```bash'),
    ].join('\n');
    expect(extractTSDocBlocks('src/example.ts', text)).toEqual([]);
  });

  it('preserves indentation and TypeScript directive comments inside fences', () => {
    const code = [
      'if (true) {',
      '  // @ts-expect-error This is intentionally invalid.',
      '  const value: number = "example";',
      '}',
    ].join('\n');
    expect(extractTSDocBlocks('src/example.ts', comment(code))[0].code).toBe(
      code,
    );
  });

  it('finds handwritten sources and excludes both generated directory variants', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pinecone-tsdoc-'));
    try {
      for (const file of [
        'src/index.ts',
        'src/nested/client.ts',
        'src/nested/notes.md',
        'src/pinecone-generated-ts-fetch/api.ts',
        'src/pinecone-generated-ts-fetch-alpha/api.ts',
      ]) {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        fs.writeFileSync(path.join(root, file), '');
      }
      expect(
        findTypeScriptFiles(root).map((file) => path.relative(root, file)),
      ).toEqual(['src/index.ts', 'src/nested/client.ts']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('checks TSDoc fragments against real SDK types and resolves relative source imports', () => {
    const examples = [
      ['src/good.ts', 'await pc.describeIndex("test");'],
      [
        'src/relative.ts',
        "import type { PineconeConfiguration } from './data';\nconst config: PineconeConfiguration = { apiKey: 'test' };",
      ],
      ['src/bad-client.ts', 'await pc.nonexistentMethod();'],
      [
        'src/bad-constructor.ts',
        'const pc = new Pinecone({ invalidOption: true });',
      ],
      ['src/bad-index.ts', 'await index.nonexistentMethod();'],
      ['src/bad-assistant.ts', 'await assistant.nonexistentMethod();'],
    ];
    const result = checkBlocks(
      examples.flatMap(([file, code]) =>
        extractTSDocBlocks(file, comment(code)),
      ),
      [],
    );
    expect(result.newFailures.map(({ block }) => block.sourceFile)).toEqual([
      'src/bad-client.ts',
      'src/bad-constructor.ts',
      'src/bad-index.ts',
      'src/bad-assistant.ts',
    ]);
    expect(result.anyShimmedNames.size).toBe(0);
  });
});
