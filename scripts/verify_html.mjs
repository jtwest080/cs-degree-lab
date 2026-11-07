// Checks every lesson item written in `language: html` using real Chromium:
// each reference solution passes its tests and each starter fails at least one.
// Usage: node scripts/verify_html.mjs [unit-13 ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const curriculum = yaml.load(readFileSync(join(root, 'content/curriculum.yaml'), 'utf8'));
const engineSrc = readFileSync(join(root, 'src/lib/htmlEngine.js'), 'utf8').replace(/^export /gm, '');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');
await page.evaluate(`${engineSrc}\nwindow.__e = { runHtml, testHtml };`);
const runHtml = (code) => page.evaluate((c) => window.__e.runHtml(c), code);
const testHtml = (code, tests) => page.evaluate(([c, t]) => window.__e.testHtml(c, t), [code, tests]);
const norm = (t) => String(t).replace(/\n+$/, '').split('\n').map((l) => l.trimEnd()).join('\n');

let errors = 0; let checked = 0;
const fail = (m) => { errors++; console.log('ERROR ' + m); };

async function checkItem(where, item) {
  if (!item.tests || !item.solution) return;
  checked++;
  const tests = item.tests.map((t) => ({ name: t.name, code: t.code }));
  const r = await testHtml(item.solution, tests);
  const bad = r.results.filter((t) => !t.passed);
  if (bad.length) fail(`${where}: reference solution FAILS\n      ${bad.map((b) => `${b.name}: ${b.message}`).join('\n      ')}`);
  const s = await testHtml(item.starter || '', tests);
  if (s.results.length && s.results.every((t) => t.passed)) fail(`${where}: starter already passes every test`);
}

for (const unit of curriculum.units || curriculum) {
  const folder = join(root, 'content', 'unit-' + String(unit.number).padStart(2, '0'));
  if (!existsSync(folder)) continue;
  const name = folder.split('/').pop();
  if (only.length && !only.includes(name)) continue;
  for (const f of readdirSync(folder).filter((n) => /^lesson-.*\.yaml$/.test(n)).sort()) {
    const data = yaml.load(readFileSync(join(folder, f), 'utf8'));
    if ((data.language || unit.language) !== 'html') continue;
    const where = `${name}/${f}`;
    for (const [i, ex] of (data.examples || []).entries()) {
      if ((ex.language || 'html') !== 'html' || ex.runnable === false) continue;
      const r = await runHtml(ex.code); checked++;
      if (r.error && !ex.expectError) { fail(`${where} example ${i + 1} fails: ${r.error}`); continue; }
      if ('output' in ex && norm(r.output) !== norm(ex.output)) fail(`${where} example ${i + 1}: console output differs\n      shown: ${JSON.stringify(ex.output)}\n      real:  ${JSON.stringify(r.output)}`);
    }
    for (const ex of data.exercises || []) await checkItem(`${where} exercise ${ex.id}`, ex);
    for (const [i, q] of (data.quiz || []).entries()) if (q.type === 'code') await checkItem(`${where} quiz ${i + 1}`, q);
  }
  const pp = join(folder, 'project.yaml');
  if (existsSync(pp)) { const p = yaml.load(readFileSync(pp, 'utf8')); if ((p.language || unit.language) === 'html') await checkItem(`${name}/project.yaml`, p); }
}
await browser.close();
console.log(`\nHTML engine: checked ${checked} items, ${errors} errors.`);
process.exit(errors ? 1 : 0);
