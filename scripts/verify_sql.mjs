// Checks every SQL lesson: worked examples show exactly what SQLite returns,
// every reference solution passes its tests, and every starter fails one.
// Usage: node scripts/verify_sql.mjs [unit-12 ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { runSql, testSql } from '../src/lib/sqlEngine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const curriculum = yaml.load(readFileSync(join(root, 'content/curriculum.yaml'), 'utf8'));
const units = (curriculum.units || curriculum).filter((u) => u.language === 'sql');
const norm = (t) => String(t).replace(/\n+$/, '').split('\n').map((l) => l.trimEnd()).join('\n');

let errors = 0;
let checked = 0;
const fail = (msg) => { errors++; console.log('ERROR ' + msg); };

async function checkItem(where, item, prelude) {
  if (!item.tests || !item.solution) return;
  checked++;
  const pre = item.prelude ?? prelude ?? '';
  const tests = item.tests.map((t) => ({ name: t.name, code: t.code, allowError: t.allowError }));
  const r = await testSql(item.solution, tests, pre);
  const bad = r.results.filter((t) => !t.passed);
  if (bad.length) fail(`${where}: reference solution FAILS\n      ${bad.map((b) => `${b.name}: ${b.message}`).join('\n      ')}`);
  const s = await testSql(item.starter || '', tests, pre);
  if (s.results.length && s.results.every((t) => t.passed)) fail(`${where}: starter already passes every test`);
}

for (const unit of units) {
  const folder = join(root, 'content', 'unit-' + String(unit.number).padStart(2, '0'));
  if (!existsSync(folder)) continue;
  const name = folder.split('/').pop();
  if (only.length && !only.includes(name)) continue;
  for (const f of readdirSync(folder).filter((n) => /^lesson-.*\.yaml$/.test(n)).sort()) {
    const data = yaml.load(readFileSync(join(folder, f), 'utf8'));
    const where = `${name}/${f}`;
    for (const [i, ex] of (data.examples || []).entries()) {
      if ((ex.language || 'sql') !== 'sql' || ex.runnable === false) continue;
      const r = await runSql(ex.code, ex.prelude ?? data.prelude ?? '');
      checked++;
      if (r.error && !ex.expectError) { fail(`${where} example ${i + 1} fails: ${r.error}`); continue; }
      if (ex.expectError) {
        if (!r.error) fail(`${where} example ${i + 1}: expected an error`);
        else if (ex.error && ex.error.trim() !== r.error.trim()) fail(`${where} example ${i + 1}: shown error differs\n      shown: ${ex.error}\n      real:  ${r.error}`);
        continue;
      }
      if ('output' in ex && norm(r.output) !== norm(ex.output)) {
        fail(`${where} example ${i + 1}: shown output differs\n      shown: ${JSON.stringify(ex.output)}\n      real:  ${JSON.stringify(r.output)}`);
      }
    }
    for (const ex of data.exercises || []) await checkItem(`${where} exercise ${ex.id}`, ex, data.prelude);
    for (const [i, q] of (data.quiz || []).entries()) if (q.type === 'code') await checkItem(`${where} quiz ${i + 1}`, q, data.prelude);
  }
  const pp = join(folder, 'project.yaml');
  if (existsSync(pp)) { const p = yaml.load(readFileSync(pp, 'utf8')); await checkItem(`${name}/project.yaml`, p, p.prelude); }
}
console.log(`\nSQL engine: checked ${checked} items, ${errors} errors.`);
process.exit(errors ? 1 : 0);
