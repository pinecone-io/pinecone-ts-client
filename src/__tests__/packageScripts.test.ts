import * as fs from 'fs';
import * as path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
);

describe('package.json lifecycle scripts', () => {
  test('declares no install-time lifecycle script, so registry installs stay script-free', () => {
    for (const scriptName of [
      'preinstall',
      'install',
      'postinstall',
      'prepare',
    ]) {
      expect(packageJson.scripts[scriptName]).toBeUndefined();
    }
  });

  test('builds before the package is packed or published', () => {
    expect(packageJson.scripts.prepack).toMatch(/\bbuild\b/);
  });
});
