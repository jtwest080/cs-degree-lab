// Checks every C lesson: worked examples print exactly what is shown, every
// reference solution passes its tests, and every starter fails at least one.
// Uses the same PicoC engine as the browser.
//
// Usage: node scripts/verify_c.mjs [unit-09 ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { runC, testC } from '../src/lib/cEngine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const curriculum = yaml.load(readFileSync(join(root, 'content/curriculum.yaml'), 'utf8'));
const units = (curriculum.units || curriculum).filter((u) => u.language === 'c');
const norm = (t) => String(t).replace(/\n+$/, '').split('\n').map((l) => l.trimEnd()).join('\n');

let errors = 0;
let checked = 0;
const fail = (msg) => { errors++; console.log('ERROR ' + msg); };

async function checkItem(where, item) {
  if (!item.tests || !item.solution) return;
  checked++;
  const tests = item.tests.map((t) => ({ name: t.name, code: t.code, append: t.append, allowError: t.allowError }));
  const r = await testC(item.solution, tests);
  const bad = r.results.filter((t) => !t.passed);
  if (bad.length) fail(`${where}: reference solution FAILS\n      ${bad.map((b) => `${b.name}: ${b.message}`).join('\n      ')}`);
  const s = await testC(item.starter || '', tests);
  if (s.results.length && s.results.every((t) => t.passed)) fail(`${where}: starter already passes every test`);
}

for (const unit of units) {
  const folder = join(root, 'content', 'unit-' + String(unit.number).padStart(2, '0'));
  if (!existsSync(folder)) continue;
  if (only.length && !only.includes(folder.split('/').pop())) continue;
  for (const f of readdirSync(folder).filter((n) => /^lesson-.*\.yaml$/.test(n)).sort()) {
    const data = yaml.load(readFileSync(join(folder, f), 'utf8'));
    const where = `${folder.split('/').pop()}/${f}`;
    for (const [i, ex] of (data.examples || []).entries()) {
      if ((ex.language || 'c') !== 'c' || ex.runnable === false) continue;
      const r = await runC(ex.code);
      checked++;
      if (r.error && !ex.expectError) { fail(`${where} example ${i + 1} fails:\n${r.error}`); continue; }
      if ('output' in ex && norm(r.output) !== norm(ex.output)) {
        fail(`${where} example ${i + 1}: shown output differs\n      shown: ${JSON.stringify(ex.output)}\n      real:  ${JSON.stringify(r.output)}`);
      }
    }
    for (const ex of data.exercises || []) await checkItem(`${where} exercise ${ex.id}`, ex);
    for (const [i, q] of (data.quiz || []).entries()) if (q.type === 'code') await checkItem(`${where} quiz ${i + 1}`, q);
  }
  const pp = join(folder, 'project.yaml');
  if (existsSync(pp)) await checkItem(`${folder.split('/').pop()}/project.yaml`, yaml.load(readFileSync(pp, 'utf8')));
}
console.log(`\nC engine: checked ${checked} items, ${errors} errors.`);
process.exit(errors ? 1 : 0);
