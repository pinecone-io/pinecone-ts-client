// Compile the actual published package with full library checking. Check every
// declaration (including alpha runtimes), not only exports reachable from index.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'pinecone-declarations-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  const packed = execFileSync(
    npm,
    ['pack', '--json', '--pack-destination', scratch],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  const [{ filename }] = JSON.parse(packed);
  writeFileSync(join(scratch, 'package.json'), '{"private":true}');
  execFileSync(
    npm,
    [
      'install',
      join(scratch, filename),
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ],
    {
      cwd: scratch,
      stdio: 'inherit',
    },
  );
  mkdirSync(join(scratch, 'node_modules/@types'), { recursive: true });
  symlinkSync(
    dirname(require.resolve('@types/node/package.json')),
    join(scratch, 'node_modules/@types/node'),
    'junction',
  );
  writeFileSync(
    join(scratch, 'index.ts'),
    `import { Pinecone } from '@pinecone-database/pinecone';
new Pinecone({ apiKey: 'test', fetchApi: fetch });
`,
  );
  cpSync(join(root, 'ts-compilation-test/src'), join(scratch, 'consumer'), {
    recursive: true,
  });
  for (const lib of [['es2022'], ['es2022', 'dom'], ['es2022', 'webworker']]) {
    writeFileSync(
      join(scratch, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          lib,
          types: ['node'],
          skipLibCheck: false,
          strict: true,
          target: 'es2022',
          module: 'commonjs',
          moduleResolution: 'node',
          noEmit: true,
        },
        include: [
          'index.ts',
          'consumer/**/*.ts',
          'node_modules/@pinecone-database/pinecone/**/*.d.ts',
        ],
      }),
    );
    execFileSync(
      process.execPath,
      [require.resolve('typescript/bin/tsc'), '-p', scratch],
      { cwd: scratch, stdio: 'inherit' },
    );
    console.log(`Published declarations compile with lib: ${lib.join(', ')}.`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
