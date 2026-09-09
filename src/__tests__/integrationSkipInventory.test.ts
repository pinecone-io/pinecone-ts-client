import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import * as ts from 'typescript';

type Skip = { line: number; expression: string; tracking?: string };
const jestNames = new Set(['test', 'it', 'describe']);

function rootName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  if (
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression)
  )
    return rootName(expression.expression);
  if (ts.isCallExpression(expression)) return rootName(expression.expression);
  return undefined;
}

// Read comments attached to the skipped statement or an enclosing suite. This
// follows syntax boundaries, not a fixed number of preceding source lines.
function trackingComment(
  node: ts.Node,
  source: ts.SourceFile,
): string | undefined {
  for (
    let ancestor: ts.Node | undefined = node;
    ancestor;
    ancestor = ancestor.parent
  ) {
    if (!ts.isStatement(ancestor)) continue;
    const comments =
      ts.getLeadingCommentRanges(source.text, ancestor.getFullStart()) ?? [];
    for (const comment of comments) {
      const text = source.text.slice(comment.pos, comment.end);
      const match = text.match(
        /@integration-skip\s+#([1-9]\d*):\s*(\S[^\r\n]*)/,
      );
      if (match) {
        const reason = match[2].replace(/\s*\*\/$/, '').trim();
        if (reason) return `#${match[1]}: ${reason}`;
      }
    }
  }
  return undefined;
}

function inventory(text: string): Skip[] {
  const source = ts.createSourceFile(
    'integration.test.ts',
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const skips: Skip[] = [];
  const visit = (node: ts.Node) => {
    const access = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : ts.isElementAccessExpression(node) &&
          ts.isStringLiteral(node.argumentExpression)
        ? node.argumentExpression.text
        : undefined;
    const explicitSkip =
      access === 'skip' && jestNames.has(rootName(node as ts.Expression) ?? '');
    const shorthandSkip =
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['xit', 'xtest', 'xdescribe'].includes(node.expression.text);
    if (explicitSkip || shorthandSkip) {
      skips.push({
        line:
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        expression: node.getText(source),
        tracking: trackingComment(node, source),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return skips;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(name)
      : /\.[cm]?[jt]sx?$/.test(name)
        ? [name]
        : [];
  });
}

describe('integration skip accountability', () => {
  test('every disabled suite/test and conditional skip has a tracked reason', () => {
    const root = path.resolve(__dirname, '../integration');
    const files = sourceFiles(root);
    expect(files.length).toBeGreaterThan(0);
    const untracked = files.flatMap((file) =>
      inventory(readFileSync(file, 'utf8'))
        .filter((skip) => !skip.tracking)
        .map(
          (skip) =>
            `${path.relative(root, file)}:${skip.line} ${skip.expression}`,
        ),
    );
    expect(untracked).toEqual([]);
  });

  test('recognizes direct, parameterized, computed, shorthand and conditional skips', () => {
    const source = `
      test.skip('direct', () => {});
      describe.skip.each(['case'])('parameterized', () => {});
      it['skip']('computed', () => {});
      xdescribe('shorthand', () => {});
      const testSlow = process.env.RUN_SLOW ? test : test.skip;
    `;
    expect(inventory(source)).toHaveLength(5);
    expect(inventory(source).every((skip) => !skip.tracking)).toBe(true);
  });

  test('allows a shared blocker annotation on the enclosing suite regardless of distance', () => {
    const source = `
      // @integration-skip #35: dense-only read path returns no matches
      describe('dense-only index', () => {
        ${'\n'.repeat(30)}
        test.skip('search', () => {});
        test.skip.each([1, 2])('search %d', () => {});
      });
    `;
    expect(inventory(source).map((skip) => skip.tracking)).toEqual([
      '#35: dense-only read path returns no matches',
      '#35: dense-only read path returns no matches',
    ]);
  });

  test('documents opt-in gates without executing their environment condition', () => {
    const source = `
      // @integration-skip #117: set PINECONE_TEST_BACKUP_RESTORE_CONTENTS to exercise a slow restore
      const testRestore = process.env.PINECONE_TEST_BACKUP_RESTORE_CONTENTS ? test : test.skip;
      testRestore('restores records', () => {});
    `;
    expect(inventory(source)[0].tracking).toContain('#117:');
  });

  test('unrelated comments, issue-only comments and disabled text cannot mask an untracked skip', () => {
    const source = `
      // test.skip('only a comment')
      const text = "describe.skip('only a string')";
      // issue #35
      test.skip('needs reason', () => {});
      // @integration-skip #35: only this suite is tracked
      describe('tracked', () => { test.skip('inside', () => {}); });
      test.skip('outside', () => {});
      /* @integration-skip #35: */
      test.skip('empty reason', () => {});
      helper.skip();
    `;
    expect(inventory(source).map((skip) => Boolean(skip.tracking))).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });
});
