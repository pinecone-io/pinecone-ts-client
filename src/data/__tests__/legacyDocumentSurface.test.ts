import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Preserve the flat document methods and their migration guidance. Argument and
// return compatibility are additionally checked against the packed declarations
// in ts-compilation-test/src/index.ts.
const legacyMethods = {
  upsertDocuments: 'documents.upsert',
  searchDocuments: 'documents.search',
  fetchDocuments: 'documents.fetch',
  updateDocuments: 'documents.update',
  listDocuments: 'documents.list',
  deleteDocuments: 'documents.delete',
};

const fileName = path.join(__dirname, '..', 'index.ts');
const source = ts.createSourceFile(
  fileName,
  fs.readFileSync(fileName, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const index = source.statements.find(
  (statement): statement is ts.ClassDeclaration =>
    ts.isClassDeclaration(statement) && statement.name?.text === 'Index',
)!;

describe('legacy document public surface', () => {
  test.each(Object.entries(legacyMethods))(
    '%s remains public with migration guidance',
    (name, replacement) => {
      const member = index.members.find(
        (item) => item.name?.getText(source) === name,
      );
      expect(member).toBeDefined();
      const flags = ts.getCombinedModifierFlags(member!);
      expect(
        flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected),
      ).toBe(0);
      const deprecated = ts.getJSDocDeprecatedTag(member!);
      expect(deprecated).toBeDefined();
      const links = Array.isArray(deprecated?.comment)
        ? deprecated.comment
            .filter(ts.isJSDocLink)
            .map((link) => link.name?.getText(source))
        : [];
      const target = replacement[0].toUpperCase() + replacement.slice(1);
      expect(links).toContain(target);
    },
  );

  test('the documents accessor is public and not deprecated', () => {
    const member = index.members.find(
      (item) => item.name?.getText(source) === 'documents',
    );
    expect(member).toBeDefined();
    const flags = ts.getCombinedModifierFlags(member!);
    expect(
      flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected),
    ).toBe(0);
    expect(ts.getJSDocDeprecatedTag(member!)).toBeUndefined();
  });
});
