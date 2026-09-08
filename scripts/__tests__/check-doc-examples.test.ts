import {
  classifyExclusion,
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
