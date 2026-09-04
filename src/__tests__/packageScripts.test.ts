import * as fs from 'fs';
import * as path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
);

describe('package.json lifecycle scripts', () => {
  test('declares prepack, not prepare, so registry installs stay script-free', () => {
    expect(packageJson.scripts.prepack).toBe('npm run build');
    expect(packageJson.scripts.prepare).toBeUndefined();
  });
});
