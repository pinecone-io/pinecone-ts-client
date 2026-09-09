// Run consumer JavaScript against an installed tarball, outside this checkout.
// With no argument, npm pack builds it through the package's prepack hook.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'pinecone-package-consumer-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = { ...process.env };
// A consumer must not inherit the checkout's module search path or preload hooks.
delete env.NODE_PATH;
delete env.NODE_OPTIONS;
delete env.PINECONE_API_KEY;

try {
  if (process.argv.length > 3)
    throw new Error('Usage: node scripts/test-package.mjs [package.tgz]');
  let tarball = process.argv[2] && resolve(process.argv[2]);
  if (!tarball) {
    const packed = execFileSync(
      npm,
      ['pack', '--json', '--pack-destination', scratch],
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    );
    tarball = join(scratch, JSON.parse(packed)[0].filename);
  }
  writeFileSync(join(scratch, 'package.json'), '{"private":true}');
  execFileSync(
    npm,
    ['install', tarball, '--ignore-scripts', '--no-audit', '--no-fund'],
    {
      cwd: scratch,
      env,
      stdio: 'inherit',
      timeout: 120_000,
    },
  );
  const require = createRequire(join(scratch, 'package.json'));
  const entry = realpathSync(require.resolve('@pinecone-database/pinecone'));
  const installed = relative(realpathSync(scratch), entry);
  if (!installed.startsWith(`node_modules${sep}`)) {
    throw new Error(`SDK resolved outside the isolated installation: ${entry}`);
  }
  cpSync(join(root, 'test/package-consumer'), join(scratch, 'consumer'), {
    recursive: true,
  });
  console.log(
    `Testing packed SDK with ${process.execPath} (${process.version})`,
  );
  execFileSync(
    process.execPath,
    ['--test', 'consumer/commonjs.cjs', 'consumer/esm.mjs'],
    {
      cwd: scratch,
      env,
      stdio: 'inherit',
      timeout: 120_000,
    },
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
