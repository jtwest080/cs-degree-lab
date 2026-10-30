// Copies the Pyodide runtime (Python compiled to WebAssembly) from node_modules
// into public/pyodide so the app can run Python fully offline, with no CDN.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pyodide');
const dest = join(root, 'public', 'pyodide');
const files = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(join(src, f), join(dest, f));
// Some static hosts refuse to serve .zip (or any binary) files, so also ship the
// standard library as base64 text; the app decodes it from there (see pythonEngine.js).
writeFileSync(join(dest, 'python_stdlib.b64.txt'), readFileSync(join(src, 'python_stdlib.zip')).toString('base64'));
console.log(`Copied Pyodide runtime to ${dest}`);
