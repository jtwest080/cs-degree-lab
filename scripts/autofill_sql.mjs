// Fills `output: |` + `AUTO` placeholders in a SQL lesson with real query results.
// Usage: node scripts/autofill_sql.mjs content/unit-12/lesson-01-xxx.yaml
import { readFileSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { runSql } from '../src/lib/sqlEngine.js';

const path = process.argv[2];
let text = readFileSync(path, 'utf8');
const data = yaml.load(text);
for (const [i, ex] of data.examples.entries()) {
  if (String(ex.output || '').trim() !== 'AUTO') continue;
  const r = await runSql(ex.code, ex.prelude ?? data.prelude ?? '');
  if (r.error) { console.log(`example ${i + 1} failed: ${r.error}`); continue; }
  const block = r.output.split('\n').slice(0, -1).map((l) => '      ' + l + '\n').join('');
  text = text.replace('    output: |\n      AUTO\n', '    output: |\n' + block);
  console.log(`example ${i + 1} ->\n${r.output}`);
}
writeFileSync(path, text);
