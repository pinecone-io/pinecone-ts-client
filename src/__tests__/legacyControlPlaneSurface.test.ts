import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Preserve the restored surface and its migration guidance. Argument and return
// compatibility are additionally checked against the packed declarations in
// ts-compilation-test/src/index.ts.
const legacyMethods = {
  createIndex: 'indexes.create',
  createIndexForModel: 'indexes.createForModel',
  describeIndex: 'indexes.describe',
  listIndexes: 'indexes.list',
  deleteIndex: 'indexes.delete',
  configureIndex: 'indexes.configure',
  createCollection: 'collections.create',
  describeCollection: 'collections.describe',
  listCollections: 'collections.list',
  deleteCollection: 'collections.delete',
  createBackup: 'backups.create',
  describeBackup: 'backups.describe',
  listBackups: 'backups.listByIndex',
  deleteBackup: 'backups.delete',
  createIndexFromBackup: 'backups.createIndex',
  describeRestoreJob: 'restoreJobs.describe',
  listRestoreJobs: 'restoreJobs.list',
  createAssistant: 'assistants.create',
  describeAssistant: 'assistants.describe',
  listAssistants: 'assistants.list',
  updateAssistant: 'assistants.update',
  deleteAssistant: 'assistants.delete',
  evaluate: 'assistants.evaluate',
};

const fileName = path.join(__dirname, '..', 'pinecone.ts');
const source = ts.createSourceFile(
  fileName,
  fs.readFileSync(fileName, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const client = source.statements.find(
  (statement): statement is ts.ClassDeclaration =>
    ts.isClassDeclaration(statement) && statement.name?.text === 'Pinecone',
)!;

describe('legacy control-plane public surface', () => {
  test.each(Object.entries(legacyMethods))(
    '%s remains public with migration guidance',
    (name, replacement) => {
      const member = client.members.find(
        (item) => item.name?.getText(source) === name,
      );
      expect(member).toBeDefined();
      const flags = ts.getCombinedModifierFlags(member!);
      expect(
        flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected),
      ).toBe(0);
      const deprecated = ts.getJSDocDeprecatedTag(member!);
      expect(deprecated).toBeDefined();
      expect(deprecated?.comment).toEqual(
        expect.stringContaining(`pc.${replacement}(`),
      );
    },
  );
});
