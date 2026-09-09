// Generated fetch runtimes use DOM-only aliases absent from Node's fetch types.
// Rewrite declarations after every build so regeneration stays reproducible,
// without forcing lib.dom into Node or Web Worker consumers' global scope.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

function fixDeclarations(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      fixDeclarations(path);
    } else if (entry.name.endsWith('.d.ts')) {
      const original = readFileSync(path, 'utf8');
      const updated = original
        .replace(/WindowOrWorkerGlobalScope\[['"]fetch['"]\]/g, 'typeof fetch')
        .replace(/\bRequestInfo\b/g, '(Request | string)')
        .replace(
          /\bRequestCredentials\b/g,
          "NonNullable<RequestInit['credentials']>",
        );
      if (updated !== original) writeFileSync(path, updated);
    }
  }
}

fixDeclarations(dist);
