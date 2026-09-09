import { spawnSync } from 'child_process';
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { scripts } from '../../package.json';

// Exercise npm's argument forwarding without running git, Docker or codegen.
describe('generate:openapi entry point', () => {
  let directory: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'codegen-entrypoint-'));
    mkdirSync(join(directory, 'codegen'));
    copyFileSync(
      join(__dirname, '../../codegen/generate-openapi.sh'),
      join(directory, 'codegen/generate-openapi.sh'),
    );
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({
        scripts: {
          'generate:openapi': scripts['generate:openapi'],
          build: 'echo build >> calls',
          format: 'echo format >> calls',
        },
      }),
    );
    writeFileSync(
      join(directory, 'codegen/build-oas.sh'),
      'printf "generate:%s:%s\\n" "$1" "${2:-}" >> calls\nexit "${GENERATION_EXIT:-0}"\n',
    );
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));

  const invoke = (args: string[], generationExit = '0') =>
    spawnSync('npm', ['run', 'generate:openapi', '--', ...args], {
      cwd: directory,
      encoding: 'utf8',
      env: { ...process.env, GENERATION_EXIT: generationExit },
    });

  test.each([['2026-07'], ['2026-04', '--update-pin']])(
    'forwards version %s and completes build/format',
    (...args) => {
      const result = invoke(args);
      expect(result.status).toBe(0);
      expect(readFileSync(join(directory, 'calls'), 'utf8')).toBe(
        `generate:${args[0]}:${args[1] ?? ''}\nbuild\nformat\n`,
      );
    },
  );

  test.each([
    [],
    ['--update-pin'],
    ['2026-07', '--unknown'],
    ['2026-07', '--update-pin', 'extra'],
  ])('rejects invalid arguments %j before any generation', (...args) => {
    const result = invoke(args);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Usage: npm run generate:openapi');
    expect(() => readFileSync(join(directory, 'calls'))).toThrow();
  });

  test('does not build or format after generation fails', () => {
    const result = invoke(['2026-07'], '7');
    expect(result.status).toBe(7);
    expect(readFileSync(join(directory, 'calls'), 'utf8')).toBe(
      'generate:2026-07:\n',
    );
  });
});
