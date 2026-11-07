// Checks every `language: javascript` lesson item with the same execution rules as
// src/workers/js.worker.js (console.log captured, tests re-run the learner's code).
// Usage: node scripts/verify_js.mjs [unit-13 ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { execute, runTests } from '../src/lib/jsEngine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const curriculum = yaml.load(readFileSync(join(root, 'content/curriculum.yaml'), 'utf8'));
const norm = (t) => String(t).replace(/\n+$/, '').split('\n').map((l) => l.trimEnd()).join('\n');

let errors = 0; let checked = 0;
const fail = (m) => { errors++; console.log('ERROR ' + m); };
async function checkItem(where, item) {
  if (!item.tests || !item.solution) return;
  checked++;
  const bad = (await runTests(item.solution, item.tests)).results.filter((t) => !t.passed);
  if (bad.length) fail(`${where}: reference solution FAILS\n      ${bad.map((b) => `${b.name}: ${b.message}`).join('\n      ')}`);
  const s = (await runTests(item.starter || '', item.tests)).results;
  if (s.length && s.every((t) => t.passed)) fail(`${where}: starter already passes every test`);
}
for (const unit of curriculum.units || curriculum) {
  const folder = join(root, 'content', 'unit-' + String(unit.number).padStart(2, '0'));
  if (!existsSync(folder)) continue;
  const name = folder.split('/').pop();
  if (only.length && !only.includes(name)) continue;
  for (const f of readdirSync(folder).filter((n) => /^lesson-.*\.yaml$/.test(n)).sort()) {
    const data = yaml.load(readFileSync(join(folder, f), 'utf8'));
    if ((data.language || unit.language) !== 'javascript') continue;
    const where = `${name}/${f}`;
    for (const [i, ex] of (data.examples || []).entries()) {
      if ((ex.language || 'javascript') !== 'javascript' || ex.runnable === false) continue;
      const r = await execute(ex.code); checked++;
      if (r.error && !ex.expectError) { fail(`${where} example ${i + 1} fails: ${r.error}`); continue; }
      if ('output' in ex && norm(r.output) !== norm(ex.output)) fail(`${where} example ${i + 1}: shown output differs\n      shown: ${JSON.stringify(ex.output)}\n      real:  ${JSON.stringify(r.output)}`);
    }
    for (const ex of data.exercises || []) await checkItem(`${where} exercise ${ex.id}`, ex);
    for (const [i, q] of (data.quiz || []).entries()) if (q.type === 'code') await checkItem(`${where} quiz ${i + 1}`, q);
  }
}
console.log(`\nJavaScript: checked ${checked} items, ${errors} errors.`);
process.exit(errors ? 1 : 0);
