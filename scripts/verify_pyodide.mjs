// Runs every reference solution, starter and worked example through the exact
// Python runtime the browser uses (Pyodide), via Node. Complements
// verify_content.py, which uses your desktop Python.
//
// Usage: node scripts/verify_pyodide.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { loadPyodide } from 'pyodide';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const py = await loadPyodide();
py.runPython(readFileSync(join(root, 'src/lib/harness.py'), 'utf8'));
const runTests = py.globals.get('run_tests');
const runProgram = py.globals.get('run_program');

const lines = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v.map(String) : String(v).replace(/\n$/, '').split('\n'));
const toJs = (r) => r.toJs({ dict_converter: Object.fromEntries });
const norm = (t) => String(t).replace(/\n+$/, '').split('\n').map((l) => l.trimEnd()).join('\n');

let errors = 0;
let checked = 0;
function check(where, item, prelude) {
  if (!item.tests || !item.solution) return;
  const tests = item.tests.map((t) => ({ name: t.name, code: t.code }));
  const pre = item.prelude ?? prelude ?? '';
  const r = toJs(runTests(item.solution, py.toPy(tests), py.toPy(lines(item.testInput)), pre));
  const failed = r.results.filter((t) => !t.passed);
  if (r.error || failed.length) {
    errors++;
    console.log(`ERROR ${where}: solution fails in Pyodide\n  ${r.error || ''}\n  ${failed.map((f) => `${f.name}: ${f.message}`).join('\n  ')}`);
  }
  // A deliberately slow starter (marked slowStarter: true) can't be interrupted here;
  // verify_content.py checks it with a time limit instead.
  const s = item.slowStarter ? { results: [] } : toJs(runTests(item.starter || '', py.toPy(tests), py.toPy(lines(item.testInput)), pre));
  if (s.results.length && s.results.every((t) => t.passed)) {
    errors++;
    console.log(`ERROR ${where}: starter already passes`);
  }
  checked++;
}

const units = yaml.load(readFileSync(join(root, 'content/curriculum.yaml'), 'utf8')).units;
for (const u of units) {
  if (u.language === 'c' || u.language === 'sql') continue; // checked by verify_c.mjs / verify_sql.mjs
  const dir = join(root, 'content', `unit-${String(u.number).padStart(2, '0')}`);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort()) {
    const l = yaml.load(readFileSync(join(dir, f), 'utf8'));
    (l.examples || []).forEach((ex, i) => {
      if ((ex.language || 'python') !== 'python' || ex.runnable === false) return;
      const r = toJs(runProgram(ex.code, py.toPy(lines(ex.stdin)), l.prelude || ''));
      if (r.error && !ex.expectError) { errors++; console.log(`ERROR ${f} example ${i + 1}: ${r.error}`); }
      if (ex.output != null && norm(r.output) !== norm(ex.output)) {
        errors++;
        console.log(`ERROR ${f} example ${i + 1}: output differs in Pyodide\n  shown: ${JSON.stringify(ex.output)}\n  real:  ${JSON.stringify(r.output)}`);
      }
    });
    (l.exercises || []).forEach((ex) => check(`${f} ${ex.id}`, ex, l.prelude));
    (l.quiz || []).forEach((q, i) => q.type === 'code' && check(`${f} quiz ${i + 1}`, q, l.prelude));
  }
  const proj = join(dir, 'project.yaml');
  if (existsSync(proj)) check(`unit ${u.number} project`, yaml.load(readFileSync(proj, 'utf8')));
}
console.log(`\nPyodide ${py.version}: checked ${checked} solvable items, ${errors} errors.`);
process.exit(errors ? 1 : 0);
